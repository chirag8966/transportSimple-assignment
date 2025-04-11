import { AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import {
  CanvasConfig,
  DrawingConfig,
  TravelDetails,
  VisualizationState
} from './trip-visualizer.model';

@Component({
  selector: 'app-trip-visualizer',
  standalone: true,
  imports: [],
  templateUrl: './trip-visualizer.component.html',
  styleUrl: './trip-visualizer.component.scss'
})
export class TripVisualizerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private canvas: CanvasConfig = {
    ctx: null,
    isInitialized: false,
    resizeListener: () => { }
  };

  private drawing: DrawingConfig = {
    initialX: 100, 
    initialY: 300, 
    lineLength: 250,
    circleDiff: 10,
    isUpper: false
  };

  private state: VisualizationState = {
    travels: [],
    drawPoints: [],
    colorMap: []
  };

  renderer = inject(Renderer2);

  /**
   * Accepts trip points input from parent component
   */
  @Input() set tripPoints(value: { start: string; end: string } | null) {
    if (value?.start && value?.end) {
      this.addTravelDetails(value.start, value.end);
    }
  }

  ngAfterViewInit(): void {
    this.setupCanvas();
  }

  ngOnDestroy() {
    // Remove the event listener when component is destroyed
    this.canvas.resizeListener();
  }

  /**
   * Sets up the canvas and event listeners
   */
  private setupCanvas() {
    this.initializeCanvas();

    // Use Renderer2 to listen for window resize events
    this.canvas = {
      ...this.canvas,
      resizeListener: this.renderer.listen('window', 'resize', () => {
        this.resizeCanvas();
      })
    };
  }

  /**
   * Handles canvas resizing to maintain responsiveness
   */
  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;

    if (!container) return;

    // Get the container's dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight / 2;

    // Set canvas dimensions to match container
    this.renderer.setAttribute(canvas, 'width', containerWidth.toString());
    this.renderer.setAttribute(canvas, 'height', containerHeight.toString());

    // Redraw the canvas content
    this.drawCanvas();
  }

  /**
   * Initializes the canvas and its context
   */
  private initializeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.canvas.ctx = canvas.getContext('2d');

    if (!this.canvas.ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    this.resizeCanvas();
    this.canvas.isInitialized = true;
  }

  /**
   * Adds new travel details and triggers redraw
   */
  private addTravelDetails(start: string, end: string) {
    if (!this.canvas.isInitialized || !this.canvas.ctx) {
      console.warn('Canvas not initialized yet');
      return;
    }

    const travelDetails: TravelDetails = {
      startPoint: start,
      endPoint: end
    };

    this.state = {
      ...this.state,
      travels: [
        ...this.state.travels,
        travelDetails
      ]
    };

    this.drawing = {
      ...this.drawing,
      lineLength: Math.min(250, (this.canvasRef.nativeElement.width - 200) / this.state.travels.length)
    };

    this.drawCanvas();
  }

  /**
   * Main drawing method that controls the canvas rendering
   */
  private drawCanvas() {
    if (!this.canvas.ctx || !this.canvasRef) {
      console.warn('Canvas context not available');
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    this.canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.drawing = {
      ...this.drawing,
      initialX: 100,
      initialY: canvas.height / 2,
      isUpper: false
    };

    this.state = {
      ...this.state,
      drawPoints: []
    };

    // Calculate and create drawing points
    this.calculateDrawPoints();

    // Draw only connected points
    this.drawConnectedPoints();
  }

  /**
   * Calculate positions and connections of all points
   */
  private calculateDrawPoints() {
    for (let i = 0; i < this.state.travels.length; i++) {
      const cur = this.state.travels[i];
      const prev = this.state.travels[i - 1];
      const next = this.state.travels[i + 1];

      // First point is always handled separately
      if (typeof prev === 'undefined') {
        this.addFirstPoint(cur);
        continue;
      }

      const isSameAsPrev = cur.startPoint === prev.startPoint && cur.endPoint === prev.endPoint;
      const isSameAsNext = next && cur.startPoint === next.startPoint && cur.endPoint === next.endPoint;
      const isConnectedToPrev = prev.endPoint === cur.startPoint;

      // Handle possible drawing scenarios
      if (isSameAsPrev || isSameAsNext) {
        i = this.handleDuplicateRoutes(i, cur, isSameAsPrev, isSameAsNext);
      } else if (isConnectedToPrev) {
        this.handleConnectedRoutes(i, cur);
      } else {
        this.handleDisconnectedRoutes(i, cur);
      }
    }
  }

  /**
   * Add the first point in the travel sequence
   */
  private addFirstPoint(details: TravelDetails) {
    this.addDrawPoint(
      this.drawing.initialX,
      this.drawing.initialY,
      this.formatPointLabel(details.startPoint, details.endPoint),
      true,
      details.startPoint,
      details.endPoint
    );
  }

  /**
   * Handle routes that are duplicates of previous or next routes
   */
  private handleDuplicateRoutes(index: number, cur: TravelDetails,
    isSameAsPrev: boolean, isSameAsNext: boolean): number {
    // Handle special cases for the second point
    if (index === 1) {
      if (isSameAsPrev && isSameAsNext) {
        this.handleDuplicatePoints(index);
      } else if (isSameAsNext) {
        this.handleUpCurvePoints(index);
        index++; // Skip the next point since we've already handled it
      } else {
        this.handleDuplicatePoints(index);
      }
    } else {
      // Handle general cases
      if (this.drawing.isUpper) {
        this.createPlainLinePoint();
        this.addPointForCurrentRoute(cur);
      } else {
        this.handleUpCurvePoints(index);
        index++; // Skip the next point since we've already handled it
      }
    }
    return index;
  }

  /**
   * Handle routes that connect to the previous route
   */
  private handleConnectedRoutes(index: number, cur: TravelDetails) {
    if (this.drawing.isUpper) {
      this.handleDownCurvePoints(index);
    } else {
      this.createPlainLinePoint();
      this.addPointForCurrentRoute(cur);
    }
  }

  /**
   * Handle routes that don't connect to the previous route
   */
  private handleDisconnectedRoutes(index: number, cur: TravelDetails) {
    if (this.drawing.isUpper) {
      this.handleDownCurvePoints(index);
    } else {
      this.createPlainLinePoint(true);
      this.addPointForCurrentRoute(cur);
    }
  }

  /**
   * Helper method to add a point for the current route
   */
  private addPointForCurrentRoute(route: TravelDetails) {
    this.addDrawPoint(
      this.drawing.initialX,
      this.drawing.initialY,
      this.formatPointLabel(route.startPoint, route.endPoint),
      true,
      route.startPoint,
      route.endPoint
    );
  }

  /**
   * Format the label text for a point
   */
  private formatPointLabel(startPoint: string, endPoint: string): string {
    return `${startPoint.substring(0, 3).toUpperCase()} - ${endPoint.substring(0, 3).toUpperCase()}`;
  }

  /**
   * Draw all connected points with their labels
   */
  private drawConnectedPoints() {
    if (!this.canvas.ctx) return;

    // Draw all lines and connected circles
    for (const point of this.state.drawPoints.filter(p => p.isConnected)) {
      // Get color for this point
      const pointColor = this.getLineColor(point.startPoint, point.endPoint);

      // Draw the circle with consistent color
      this.canvas.ctx.beginPath();
      this.canvas.ctx.strokeStyle = pointColor;
      this.canvas.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      this.canvas.ctx.stroke();

      // Draw the text
      this.canvas.ctx.fillStyle = pointColor;
      this.canvas.ctx.textAlign = 'center'; // Center align the text
      this.canvas.ctx.fillText(
        point.text,
        point.x, // Center the text horizontally
        point.y - 10 // Position the text above the dot
      );

      // Reset fill style to default
      this.canvas.ctx.fillStyle = 'black';
    }
  }

  /**
   * Create a point with a straight line connecting to the previous point
   */
  private createPlainLinePoint(addArrow: boolean = false) {
    if (!this.canvas.ctx) return;

    const startX = this.drawing.initialX;
    const startY = this.drawing.initialY;
    const endX = this.drawing.initialX + this.drawing.lineLength;

    // Get current travel details for color tracking
    const currentIndex = this.state.drawPoints.length > 0 ? Math.floor(this.state.drawPoints.length / 2) : 0;
    if (currentIndex < this.state.travels.length) {
      const current = this.state.travels[currentIndex];

      // Draw the line
      this.drawLine(startX, startY, endX, startY, current.startPoint, current.endPoint);

      // Draw arrow if this is a disconnected route
      if (addArrow) {
        this.drawArrow(endX, startY, current.startPoint, current.endPoint);
      }

      // Mark the points at both ends as connected
      this.connectNearbyPoints(startX, startY);

      // Update position using spread operator
      this.drawing = {
        ...this.drawing,
        initialX: endX + this.drawing.circleDiff
      };

      this.addDrawPoint(endX, startY, "", true, current.startPoint, current.endPoint);
    }
  }

  /**
   * Draw a line between two points with the appropriate color
   */
  private drawLine(x1: number, y1: number, x2: number, y2: number, startPoint: string, endPoint: string) {
    if (!this.canvas.ctx) return;

    // Get existing color or create new one
    const color = this.getLineColor(startPoint, endPoint);

    // Add 5px gaps between the line and dots
    const dotRadius = 5;
    const gapSize = 5;

    this.canvas.ctx.beginPath();
    this.canvas.ctx.moveTo(x1 + this.drawing.circleDiff + gapSize, y1);
    this.canvas.ctx.lineTo(x2 - gapSize - dotRadius, y2);
    this.canvas.ctx.lineWidth = 2;
    this.canvas.ctx.strokeStyle = color;
    this.canvas.ctx.stroke();
  }

  /**
   * Mark nearby points as connected
   */
  private connectNearbyPoints(x: number, y: number) {
    const updatedPoints = this.state.drawPoints.map(point => {
      if (Math.abs(point.x - x) < 10 && Math.abs(point.y - y) < 10) {
        return { ...point, isConnected: true };
      }
      return point;
    });

    this.state = {
      ...this.state,
      drawPoints: updatedPoints
    };
  }

  /**
   * Handle drawing points that form an upward curve
   */
  private handleUpCurvePoints(k: number) {
    if (!this.canvas.ctx) return;

    const curveEndX = this.drawing.initialX + 138;
    const curveEndY = this.drawing.initialY - 80;

    // Get consistent color for this route
    const color = this.getLineColor(
      this.state.travels[k].startPoint,
      this.state.travels[k].endPoint
    );

    // Draw the curves with consistent color
    this.drawArc(this.drawing.initialX, this.drawing.initialY - 80, 80, 25, 82, false, color);
    this.drawArc(this.drawing.initialX + 140, this.drawing.initialY, 82, 205, -100, false, color);

    // Update position using spread operator
    this.drawing = {
      ...this.drawing,
      initialX: curveEndX,
      initialY: curveEndY,
      isUpper: true
    };

    // Add points for current and next routes
    const current = this.state.travels[k];
    const next = this.state.travels[k + 1];

    this.addDrawPoint(
      this.drawing.initialX,
      this.drawing.initialY,
      this.formatPointLabel(current.startPoint, current.endPoint),
      true,
      current.startPoint,
      current.endPoint
    );

    this.createPlainLinePoint();

    this.addDrawPoint(
      this.drawing.initialX,
      this.drawing.initialY,
      this.formatPointLabel(next.startPoint, next.endPoint),
      true,
      next.startPoint,
      next.endPoint
    );
  }

  /**
   * Handle drawing points that form a downward curve
   */
  private handleDownCurvePoints(j: number) {
    if (!this.canvas.ctx) return;

    const curveEndX = this.drawing.initialX + 85;
    const curveEndY = this.drawing.initialY + 80;

    // Get consistent color for this route
    const color = this.getLineColor(
      this.state.travels[j].startPoint,
      this.state.travels[j].endPoint
    );

    // Draw the curves with consistent color
    this.drawArc(this.drawing.initialX - 34, this.drawing.initialY + 64, 80, 345, 305, true, color);
    this.drawArc(this.drawing.initialX + 116, this.drawing.initialY + 4, 82, 160, 120, true, color);

    // Update position using spread operator
    this.drawing = {
      ...this.drawing,
      initialY: curveEndY,
      initialX: curveEndX,
      isUpper: false
    };

    // Add the point for current route
    const current = this.state.travels[j];

    this.addDrawPoint(
      this.drawing.initialX,
      this.drawing.initialY,
      this.formatPointLabel(current.startPoint, current.endPoint),
      true,
      current.startPoint,
      current.endPoint
    );
  }

  /**
   * Handle duplicate points that need to be drawn at different vertical levels
   */
  private handleDuplicatePoints(l: number) {
    if (!this.canvas.ctx || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    this.canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);

    const upperY = this.drawing.initialY - 100;
    const prevRoute = this.state.travels[l - 1];
    const currentRoute = this.state.travels[l];

    // Add point for previous route
    this.addDrawPoint(
      this.drawing.initialX,
      upperY,
      this.formatPointLabel(prevRoute.startPoint, prevRoute.endPoint),
      true,
      prevRoute.startPoint,
      prevRoute.endPoint
    );

    // Draw line from previous to current
    this.drawLine(
      this.drawing.initialX,
      upperY,
      this.drawing.initialX + this.drawing.lineLength,
      upperY,
      prevRoute.startPoint,
      prevRoute.endPoint
    );

    // Update position using spread operator
    const newX = this.drawing.initialX + this.drawing.lineLength + this.drawing.circleDiff;
    this.drawing = {
      ...this.drawing,
      initialX: newX,
      initialY: upperY,
      isUpper: true
    };

    // Add point for current route
    this.addDrawPoint(
      this.drawing.initialX - this.drawing.circleDiff,
      upperY,
      this.formatPointLabel(currentRoute.startPoint, currentRoute.endPoint),
      true,
      currentRoute.startPoint,
      currentRoute.endPoint
    );
  }

  /**
   * Draw an arc segment with specified parameters
   */
  private drawArc(xPos: number, yPos: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean, lineColor: string) {
    if (!this.canvas.ctx) return;

    const startAngleRad = startAngle * (Math.PI / 180);
    const endAngleRad = endAngle * (Math.PI / 180);
    this.canvas.ctx.strokeStyle = lineColor;
    this.canvas.ctx.lineWidth = 4;
    this.canvas.ctx.beginPath();
    this.canvas.ctx.arc(xPos, yPos, radius, startAngleRad, endAngleRad, anticlockwise);
    this.canvas.ctx.stroke();
  }

  /**
   * Get a consistent color for a route based on start and end points
   */
  private getLineColor(startPoint: string, endPoint: string): string {
    // Check if we already have a color for this route
    const existingColor = this.state.colorMap.find(
      lc => (lc.start === startPoint && lc.end === endPoint) ||
        (lc.start === endPoint && lc.end === startPoint)
    );

    if (existingColor) {
      return existingColor.color;
    }

    // Create a new color if none exists
    const newColor = this.generateRandomColor();

    this.state = {
      ...this.state,
      colorMap: [
        ...this.state.colorMap,
        {
          start: startPoint,
          end: endPoint,
          color: newColor
        }
      ]
    };

    return newColor;
  }

  /**
   * Generate a random RGB color
   */
  private generateRandomColor(): string {
    const rgb = [];
    for (let i = 0; i < 3; i++) {
      rgb.push(Math.floor(Math.random() * 255));
    }
    return `rgb(${rgb.join(',')})`;
  }

  /**
   * Draw an arrow at the end of a line
   */
  private drawArrow(x: number, y: number, startPoint: string, endPoint: string) {
    if (!this.canvas.ctx) return;

    const color = this.getLineColor(startPoint, endPoint);
    const dotRadius = 5;
    const gapSize = 5;

    // Adjust arrow position to leave gap for dot
    const arrowX = x - gapSize - dotRadius;

    // Draw arrow head
    this.canvas.ctx.beginPath();
    this.canvas.ctx.moveTo(arrowX - 8, y - 4);
    this.canvas.ctx.lineTo(arrowX - 8, y + 4);
    this.canvas.ctx.lineTo(arrowX, y);
    this.canvas.ctx.closePath();

    this.canvas.ctx.lineWidth = 3;
    this.canvas.ctx.strokeStyle = color;
    this.canvas.ctx.stroke();

    this.canvas.ctx.fillStyle = color;
    this.canvas.ctx.fill();
  }

  /**
   * Add a point to the draw points array
   */
  private addDrawPoint(x: number, y: number, text: string, isConnected: boolean, startPoint: string, endPoint: string) {
    this.state = {
      ...this.state,
      drawPoints: [
        ...this.state.drawPoints,
        { x, y, text, isConnected, startPoint, endPoint }
      ]
    };
  }

  /**
   * Resets the canvas and all trip-related variables
   */
  resetVisualizer() {
    if (this.canvas.ctx) {
      const canvas = this.canvasRef.nativeElement;
      this.canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    this.state = {
      travels: [],
      drawPoints: [],
      colorMap: []
    };

    this.drawing = {
      initialX: 0,
      initialY: 0,
      lineLength: 70,
      circleDiff: 10,
      isUpper: false
    };
  }
}
