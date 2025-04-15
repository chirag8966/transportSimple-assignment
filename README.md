# TransportSimpleAssignment

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.18.

# Application Walkthrough

link -   https://www.loom.com/share/c5972491c1bc436c89b16909a8108f1e?sid=f71c09d6-84b5-4292-9f4e-0f2a9623c8e9

# Highlights

Here are the key highlights of the project, transportSimple-assignment:​

- Framework: Built with Angular CLI version 18.2.18, the latest Long-Term Support (LTS) version at the time of development.​

- Deployment: Securely deployed using Netlify, accessible at [cjtransportsimple.netlify.app](https://cjtransportsimple.netlify.app).​

- Commit Standards: Employed conventional commits to maintain a clear and consistent commit history.​

- Component Design: Focused on reusability, ensuring components are modular and maintainable.​

- Styling: Utilized Tailwind CSS for efficient and responsive UI design.​

- Code Quality: Included configuration files like .editorconfig to enforce consistent coding styles across different editors and IDEs.​

- Project Structure: Organized using Angular's standard project structure, promoting scalability and ease of navigation.​

- For a visual walkthrough of the application, refer to the [loom video](https://www.loom.com/share/c5972491c1bc436c89b16909a8108f1e?sid=f71c09d6-84b5-4292-9f4e-0f2a9623c8e9).

## Problem Statement

Create an application with the following functionality:

- **Input fields**: Start Point and End Point.
- **Design**: Display the first three characters of the starting point and ending point.
- **Functionality**:
  - If it’s a continued trip (e.g., Bangalore to Chennai, Chennai to Ooty), then the straight line should be on level 1.
  - If it’s not a continued trip (e.g., Bangalore to Chennai, Ooty to Bangalore), then the straight line should have an arrow and be on level 1.
  - If consecutive trips have the same pickup and drop location, then those should be in Level 2.
  - Any number of trips can be added, and the design should respond accordingly to adjust within the defined dimension.

---

## Project Information

### Angular Version
This project uses **Angular CLI version 18.2.18**.

### Node Version
Ensure you have **Node.js version 16.x or higher** installed.

### Development Server
To serve the application locally:
1. Run `npm install` to install dependencies.
2. Run `ng serve` to start the development server.
3. Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you change any source files.

### Build
To build the project, run:
```
ng build
```
The build artifacts will be stored in the `dist/` directory.

### Deployment
The application is deployed and can be accessed at:
[https://cjtransportsimple.netlify.app/](https://cjtransportsimple.netlify.app/)
