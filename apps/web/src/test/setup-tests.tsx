import "@testing-library/jest-dom";
import * as ResizeObserverModule from "resize-observer-polyfill";
import { vi } from "vitest";

const ResizeObserverMock = ResizeObserverModule.default;
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
