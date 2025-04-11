/**
 * Represents a travel route with start and end points
 */
export interface TravelDetails {
  startPoint: string;
  endPoint: string;
}

/**
 * Represents a point to be drawn on the canvas
 */
export interface DrawPoint {
  x: number;
  y: number;
  text: string;
  isConnected: boolean;
  startPoint: string;
  endPoint: string;
}

/**
 * Maps routes to their colors for consistent coloring
 */
export interface LineColor {
  start: string;
  end: string;
  color: string;
}

/**
 * Canvas configuration and related properties
 */
export interface CanvasConfig {
  ctx: CanvasRenderingContext2D | null;
  isInitialized: boolean;
  resizeListener: () => void;
}

/**
 * Drawing configuration parameters
 */
export interface DrawingConfig {
  initialX: number;
  initialY: number;
  lineLength: number;
  circleDiff: number;
  isUpper: boolean; // Renamed from 'flag' for clarity
}

/**
 * Visualization data state
 */
export interface VisualizationState {
  travels: TravelDetails[];
  drawPoints: DrawPoint[];
  colorMap: LineColor[];
} 