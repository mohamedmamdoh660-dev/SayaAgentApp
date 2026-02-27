declare global {
  interface WindowEventMap {
    "settings-update": CustomEvent;
  }
}

// Module declarations for libraries without bundled TypeScript types
declare module "html2canvas";
declare module "jspdf";
