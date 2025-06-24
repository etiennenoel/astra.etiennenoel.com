# Agent Instructions for this Angular Project

This document provides a set of strict guidelines for any AI agent or developer working on this codebase. Adherence to these rules is mandatory to ensure project consistency, prevent build failures, and maintain a streamlined development process.

## 🔴 Core Directives (Non-Negotiable)

These are the most critical rules that you must follow at all times.

1.  **No Standalone Components**: All newly generated Angular components **MUST** be created with the `standalone` flag set to `false`. When using the Angular CLI, the command should be `ng generate component MyComponent --standalone=false`.
2.  **Centralized Module Declarations**: Every new component, directive, or pipe **MUST** be explicitly imported and declared in the `declarations` array of the main `app.module.ts` file. Similarly, new services must be provided in the `providers` array if they are not provided in root.
3.  **Mandatory Build Verification**: After making any changes, you **MUST** run the following commands in sequence to ensure the project installs dependencies and compiles successfully:
    ```bash
    npm install
    npm run build
    ```
    A successful build with no errors is required before considering your task complete.
4.  **No Test Files**: Do **NOT** write any unit tests (`.spec.ts` files). This project is for playground and prototyping purposes, and tests add unnecessary complexity. When generating components, use the `--skip-tests=true` flag, like so:
    `ng generate component MyComponent --standalone=false --skip-tests=true`

---

##  Workflow & Procedures

Follow this step-by-step process for all development tasks.

### 1. Generating New Components

1.  Use the Angular CLI to generate the component, ensuring `standalone` is `false` and tests are skipped.
    ```bash
    ng generate component components/MyNewComponent --standalone=false --skip-tests=true
    ```
2.  **Implement Component Logic**: Write the required logic within the `.ts` file.
3.  **Create the Template**: Add the necessary HTML structure to the `.html` file.
4.  **Apply Styles**: Add all CSS or SCSS rules to the corresponding `.scss` (or `.css`) file. Do not use inline styles.

### 2. Updating the AppModule

1.  Open `src/app/app.module.ts`.
2.  Import the new component at the top of the file:
    ```typescript
    import { MyNewComponent } from './components/my-new-component/my-new-component.component';
    ```
3.  Add the imported component to the `declarations` array within `@NgModule`:
    ```typescript
    @NgModule({
      declarations: [
        AppComponent,
        // ... other components
        MyNewComponent // Add your new component here
      ],
      // ...
    })
    ```

### 3. Generating New Services

1.  Use the Angular CLI to generate the service. By default, services are created with `providedIn: 'root'`, which is the preferred method for this project.
    ```bash
    ng generate service services/MyData
    ```
2.  Implement the service logic.
3.  Inject the service into the constructor of the components that need it.

### 4. Verification

1.  Open the project's root directory in the terminal.
2.  Run `npm install` to ensure all dependencies are correctly installed.
3.  Run `npm run build`.
4.  Analyze the output. If there are any compilation errors, you must fix them before finishing the task.

---

## 🛠️ Architectural & Coding Standards

### Naming Conventions
- **Components**: Use PascalCase suffixed with `Component` (e.g., `UserProfileComponent`). Files should be kebab-case (e.g., `user-profile.component.ts`).
- **Services**: Use PascalCase suffixed with `Service` (e.g., `AuthService`). Files should be kebab-case (e.g., `auth.service.ts`).
- **Modules**: Use PascalCase suffixed with `Module` (e.g., `AppRoutingModule`). Files should be kebab-case (e.g., `app-routing.module.ts`).
- **Pages**: Use PascalCase suffixed with `Page` (e.g., `HomePage`). Files should be kebab-case (e.g., `home.page.ts`).

### Component Design
- **Single Responsibility**: Each component should have one primary purpose.
- **Data Flow**: Use `@Input()` to pass data down from parent to child and `@Output()` with `EventEmitter` to send events up from child to parent.
- **State Management**: For simple state, use component properties. For complex or shared state, use services.

### Services and Dependency Injection
- **Root Provisioning**: Services should be provided in the root injector using `@Injectable({ providedIn: 'root' })`. This makes them singletons and available application-wide.
- **Constructor Injection**: Always use constructor injection to provide services to components and other services.

### Styling
- **Encapsulated Styles**: All styles for a component should be in its dedicated `.scss` file.
- **CSS Variables**: Use CSS variables for themeable properties like colors, fonts, and spacing where appropriate.
- **No Global Stylesheets**: Avoid adding styles to the global `styles.scss` unless it is a truly global style (like a CSS reset or a font definition).

## 🚫 Forbidden Actions

- **DO NOT** use `standalone: true` for any component, directive, or pipe.
- **DO NOT** create or modify any `.spec.ts` files.
- **DO NOT** use `any` as a type. Always use specific types or create interfaces/models.
- **DO NOT** modify the core configuration files (`angular.json`, `tsconfig.json`, `package.json`) without explicit instructions.
- **DO NOT** commit code that does not pass the `npm run build` command.
