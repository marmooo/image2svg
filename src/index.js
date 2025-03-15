import { Tooltip } from "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/+esm";
import imageCompareViewer from "https://cdn.jsdelivr.net/npm/image-compare-viewer@1.6.2/+esm";
import {
  MedianCut,
  OctreeQuantization,
} from "https://cdn.jsdelivr.net/npm/@marmooo/color-reducer@0.1.1/+esm";
import { toSVG } from "https://cdn.jsdelivr.net/npm/@marmooo/imagetracer@0.0.3/+esm";

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function initLangSelect() {
  const langSelect = document.getElementById("lang");
  langSelect.onchange = () => {
    const lang = langSelect.options[langSelect.selectedIndex].value;
    location.href = `/image2svg/${lang}/`;
  };
}

function initTooltip() {
  for (const node of document.querySelectorAll('[data-bs-toggle="tooltip"]')) {
    const tooltip = new Tooltip(node);
    node.addEventListener("touchstart", () => tooltip.show());
    node.addEventListener("touchend", () => tooltip.hide());
    node.addEventListener("click", () => {
      if (!tooltip.tip) return;
      tooltip.tip.classList.add("d-none");
      tooltip.hide();
      tooltip.tip.classList.remove("d-none");
    });
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    script.src = url;
    document.body.appendChild(script);
  });
}

class Panel {
  constructor(panel) {
    this.panel = panel;
  }

  show() {
    this.panel.classList.remove("d-none");
  }

  hide() {
    this.panel.classList.add("d-none");
  }

  getActualRect(canvas) {
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;
    const naturalWidth = canvas.width;
    const naturalHeight = canvas.height;
    const aspectRatio = naturalWidth / naturalHeight;
    let width, height, top, left, right, bottom;
    if (canvasWidth / canvasHeight > aspectRatio) {
      width = canvasHeight * aspectRatio;
      height = canvasHeight;
      top = 0;
      left = (canvasWidth - width) / 2;
      right = left + width;
      bottom = canvasHeight;
    } else {
      width = canvasWidth;
      height = canvasWidth / aspectRatio;
      top = (canvasHeight - height) / 2;
      left = 0;
      right = canvasWidth;
      bottom = top + height;
    }
    return { width, height, top, left, right, bottom };
  }
}

class LoadPanel extends Panel {
  constructor(panel) {
    super(panel);

    for (const node of document.querySelectorAll(".image-compare")) {
      const images = node.querySelectorAll("img");
      images[0].classList.remove("w-100");
      new imageCompareViewer(node, { addCircle: true }).mount();
      images[1].classList.remove("d-none");
    }
    const clipboardButton = panel.querySelector(".clipboard");
    if (clipboardButton) {
      clipboardButton.onclick = (event) => {
        this.loadClipboardImage(event);
      };
    }
    panel.querySelector(".selectImage").onclick = () => {
      panel.querySelector(".inputImage").click();
    };
    panel.querySelector(".inputImage").onchange = (event) => {
      this.loadInputImage(event);
    };
    const examples = panel.querySelector(".examples");
    if (examples) {
      for (const img of examples.querySelectorAll("img")) {
        img.onclick = () => {
          const url = img.src.replace("-64", "");
          this.loadImage(url);
        };
      }
    }
  }

  show() {
    super.show();
    document.body.scrollIntoView({ behavior: "instant" });
  }

  executeCamera() {
    this.hide();
    cameraPanel.show();
    cameraPanel.executeVideo();
  }

  handleImageOnloadEvent = (event) => {
    const img = event.currentTarget;
    filterPanel.setCanvas(img);
    const filter = new filterPanel.filters.octreeQuantization(filterPanel);
    const select = filterPanel.panel.querySelector(".filterSelect");
    select.options[0].selected = true;
    select.dispatchEvent(new Event("change"));
    filterPanel.currentFilter = filter;
    filter.apply(...filter.defaultOptions);
  };

  loadImage(url) {
    this.hide();
    filterPanel.show();
    const img = new Image();
    img.onload = (event) => this.handleImageOnloadEvent(event);
    img.src = url;
  }

  loadInputImage(event) {
    const file = event.currentTarget.files[0];
    this.loadFile(file);
    event.currentTarget.value = "";
  }

  loadFile(file) {
    if (!file.type.startsWith("image/")) return;
    if (file.type === "image/svg+xml") {
      alert("SVG is not supported.");
      return;
    }
    const url = URL.createObjectURL(file);
    this.loadImage(url);
  }

  async loadClipboardImage() {
    try {
      const items = await navigator.clipboard.read();
      const item = items[0];
      for (const type of item.types) {
        if (type === "image/svg+xml") {
          alert("SVG is not supported.");
        } else if (type.startsWith("image/")) {
          const file = await item.getType(type);
          const url = URL.createObjectURL(file);
          this.loadImage(url);
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}

class FilterPanel extends LoadPanel {
  filters = {};
  currentFilter;

  constructor(panel) {
    super(panel);
    this.panelContainer = panel.querySelector(".panelContainer");
    this.selectedIndex = 0;
    this.canvas = panel.querySelector("canvas");
    this.canvasContext = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvasContext = this.offscreenCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.canvasContainer = this.canvas.parentNode;
    this.svg = panel.querySelector("svg");

    panel.querySelector(".moveTop").onclick = () => this.moveLoadPanel();
    panel.querySelector(".download").onclick = () => this.download();
    panel.querySelector(".filterSelect").onchange = (event) =>
      this.filterSelect(event);
    this.addFilters();
    this.imageTracerOptions = new ImageTracerOptions(this);
  }

  show() {
    super.show();
    this.panelContainer.scrollIntoView({ behavior: "instant" });
  }

  moveLoadPanel() {
    this.hide();
    loadPanel.show();
  }

  downloadFile(file) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  download() {
    if (this.svg.children.length == 0) {
      this.imageTracerOptions.inputs.precision.dispatchEvent(
        new Event("input"),
      );
    }
    const text = this.svg.outerHTML;
    const name = "traced.svg";
    const type = "image/svg+xml";
    const file = new File([text], name, { type });
    this.downloadFile(file);
  }

  filterSelect(event) {
    const options = event.target.options;
    const selectedIndex = options.selectedIndex;
    const prevClass = options[this.selectedIndex].value;
    const currClass = options[selectedIndex].value;
    this.panel.querySelector(`.${prevClass}`).classList.add("d-none");
    this.panel.querySelector(`.${currClass}`).classList.remove("d-none");
    this.selectedIndex = selectedIndex;
    const filter = new this.filters[currClass](this);
    this.currentFilter = filter;
    filter.apply(...filter.defaultOptions);
  }

  addFilters() {
    this.filters.octreeQuantization = OctreeQuantizationFilter;
    this.filters.medianCut = MedianCutFilter;
  }

  setCanvas(canvas) {
    if (canvas.tagName.toLowerCase() === "img") {
      this.canvas.width = canvas.naturalWidth;
      this.canvas.height = canvas.naturalHeight;
      this.offscreenCanvas.width = canvas.naturalWidth;
      this.offscreenCanvas.height = canvas.naturalHeight;
    } else {
      this.canvas.width = canvas.width;
      this.canvas.height = canvas.height;
      this.offscreenCanvas.width = canvas.width;
      this.offscreenCanvas.height = canvas.height;
    }
    this.canvasContext.drawImage(canvas, 0, 0);
    this.offscreenCanvasContext.drawImage(canvas, 0, 0);
  }
}

class Filter {
  constructor(root, inputs) {
    this.root = root;
    this.inputs = inputs;
    this.addInputEvents(root, inputs);
  }

  apply() {
  }

  addInputEvents(root, inputs) {
    for (const input of Object.values(inputs)) {
      input.addEventListener("input", () => this.apply());
    }
    for (const node of root.querySelectorAll("button[title=reset]")) {
      node.onclick = () => {
        const rangeInput = node.previousElementSibling;
        rangeInput.value = rangeInput.dataset.value;
        rangeInput.dispatchEvent(new Event("input"));
      };
    }
  }
}

class ImageTracerOptions extends Filter {
  cached = false;
  defaultOptions = [0, 1, 1, 1, 3];

  constructor(filterPanel) {
    const root = filterPanel.panel.querySelector(".imageTracerOptions");
    const inputs = {
      filterHoles: root.querySelector(".filterHoles"),
      lineTolerance: root.querySelector(".lineTolerance"),
      splineTolerance: root.querySelector(".splineTolerance"),
      strokeWidth: root.querySelector(".strokeWidth"),
      precision: root.querySelector(".precision"),
    };
    super(root, inputs);
    this.filterPanel = filterPanel;
    this.canvas = document.createElement("canvas");
    this.canvasContext = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.checkFilterEvents();
  }

  checkFilterEvents() {
    const filters = this.filterPanel.panel.querySelector(".filters");
    for (const input of filters.querySelectorAll("input")) {
      input.addEventListener("input", () => {
        this.cached = false;
        this.inputs.filterHoles.value = this.defaultOptions[0];
        this.inputs.lineTolerance.value = this.defaultOptions[1];
        this.inputs.splineTolerance.value = this.defaultOptions[2];
        this.inputs.strokeWidth.value = this.defaultOptions[3];
        this.inputs.precision.value = this.defaultOptions[4];
        filterPanel.canvasContext.drawImage(this.canvas, 0, 0);
      });
    }
  }

  apply() {
    const { inputs } = this;
    const quantizer = filterPanel.currentFilter.quantizer;
    const { width, height, replaceColors } = quantizer;
    const indexedImage = quantizer.getIndexedImage();
    const options = {
      filterHoles: Number(inputs.filterHoles.value),
      lineTolerance: Number(inputs.lineTolerance.value),
      splineTolerance: Number(inputs.splineTolerance.value),
      strokeWidth: Number(inputs.strokeWidth.value),
      precision: Number(inputs.precision.value),
    };
    const svgText = toSVG(indexedImage, width, height, replaceColors, options);
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    svg.setAttribute("class", "w-100 h-100 object-fit-contain");
    filterPanel.svg.replaceWith(svg);
    filterPanel.svg = svg;
    filterPanel.canvas.classList.add("d-none");
    filterPanel.svg.classList.remove("d-none");
  }
}

class MedianCutFilter extends Filter {
  defaultOptions = [6];

  constructor(filterPanel) {
    const root = filterPanel.panel.querySelector(".medianCut");
    const inputs = {
      color: root.querySelector(".color"),
    };
    super(root, inputs);
    const imageData = filterPanel.offscreenCanvasContext.getImageData(
      0,
      0,
      filterPanel.canvas.width,
      filterPanel.canvas.height,
    );
    this.filterPanel = filterPanel;
    this.quantizer = new MedianCut(
      imageData.data,
      imageData.width,
      imageData.height,
    );
  }

  apply(color) {
    const { inputs, filterPanel } = this;
    if (color === undefined) {
      color = Number(inputs.color.value);
    } else {
      inputs.color.value = color;
    }
    if (color === 9) {
      filterPanel.canvasContext.drawImage(filterPanel.offscreenCanvas, 0, 0);
      filterPanel.canvas.classList.remove("d-none");
      filterPanel.svg.classList.add("d-none");
    } else {
      const { width, height } = this.quantizer;
      const newImage = this.quantizer.apply(2 ** color);
      const newImageData = new ImageData(newImage, width, height);
      filterPanel.canvasContext.putImageData(newImageData, 0, 0);
      filterPanel.canvas.classList.remove("d-none");
      filterPanel.svg.classList.add("d-none");
    }
  }
}

class OctreeQuantizationFilter extends Filter {
  defaultOptions = [6];

  constructor(filterPanel) {
    const root = filterPanel.panel.querySelector(".octreeQuantization");
    const inputs = {
      color: root.querySelector(".color"),
    };
    super(root, inputs);
    const imageData = filterPanel.offscreenCanvasContext.getImageData(
      0,
      0,
      filterPanel.canvas.width,
      filterPanel.canvas.height,
    );
    this.filterPanel = filterPanel;
    this.quantizer = new OctreeQuantization(
      imageData.data,
      imageData.width,
      imageData.height,
    );
  }

  apply(color) {
    const { inputs, filterPanel } = this;
    if (color === undefined) {
      color = Number(inputs.color.value);
    } else {
      inputs.color.value = color;
    }
    if (color === 9) {
      filterPanel.canvasContext.drawImage(filterPanel.offscreenCanvas, 0, 0);
      filterPanel.canvas.classList.remove("d-none");
      filterPanel.svg.classList.add("d-none");
    } else {
      const { width, height } = this.quantizer;
      const newImage = this.quantizer.apply(2 ** color);
      const newImageData = new ImageData(newImage, width, height);
      filterPanel.canvasContext.putImageData(newImageData, 0, 0);
      filterPanel.canvas.classList.remove("d-none");
      filterPanel.svg.classList.add("d-none");
    }
  }
}

const filterPanel = new FilterPanel(document.getElementById("filterPanel"));
const loadPanel = new LoadPanel(document.getElementById("loadPanel"));
loadConfig();
initLangSelect();
initTooltip();
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
globalThis.ondragover = (event) => {
  event.preventDefault();
};
globalThis.ondrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  loadPanel.loadFile(file);
};
globalThis.addEventListener("paste", (event) => {
  const item = event.clipboardData.items[0];
  const file = item.getAsFile();
  if (!file) return;
  loadPanel.loadFile(file);
});
