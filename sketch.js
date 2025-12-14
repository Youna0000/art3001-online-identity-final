//Page 2 (After index-intro page)
// BEAUTY IDENTITY LAB: P5.JS Sketch

let video;
let tracker;            
let pgSoft;
let snaps = [];

// Assets
let asianRaw, westernRaw;
let asianMasked, westernMasked;
let currentStyle = "asian";

// UI & Logic
let ui = {};
let canvasW = 640;
let canvasH = 480;
let autoFollow = false;          
let overlayPos = { x: canvasW / 2, y: canvasH / 2 };

// Containers
let app, controlsWrap, galleryWrap, titleElt, textWrap;
let videoSection;

// -------------------------- Toggle Mode --------------------------
function toggleMode() {
  autoFollow = !autoFollow;
  if (ui.modeBtn) {
    ui.modeBtn.html(autoFollow ? "Mode: Auto-Face Follow" : "Mode: Manual Mouse");
  }
}

// -------------------------- Preload --------------------------
function preload() {
  asianRaw   = loadImage("asian-makeup.png");
  westernRaw = loadImage("western-makeup.png");
}

// -------------------------- Setup --------------------------
function setup() {
  app = createDiv();
  app.id("app");
  app.style("display", "flex");
  app.style("flex-direction", "column");
  app.style("align-items", "center");
  app.style("justify-content", "flex-start");
  app.style("min-height", "100vh");
  app.style("background", "#F4C2C2");
  app.style("color", "#ff1493"); 
  app.style("font-family", "'Baloo 2', cursive"); 

  // Title
  titleElt = createP("✨ BEAUTY LAB FILTERS");
  titleElt.parent(app);
  titleElt.style("font-weight", "bold");
  titleElt.style("color", "#ff1493");
  titleElt.style("margin", "18px 0 6px");
  
  // Canvas
  const c = createCanvas(canvasW, canvasH);
  c.parent(app);
  c.style("border-radius", "12px");
  c.style("box-shadow", "0 10px 30px rgba(0,0,0,.35)");
  c.style("display", "block");
  c.style("margin", "0 auto");

  background(20);

  // Webcam
  video = createCapture(VIDEO);
  video.size(canvasW, canvasH);
  video.hide();

  // Optional Face Tracker
  if (typeof clm !== "undefined" && typeof pModel !== "undefined") {
    tracker = new clm.tracker();
    tracker.init(pModel);
    tracker.start(video.elt);
  }

  pgSoft = createGraphics(canvasW, canvasH);

  // Controls
  controlsWrap = createDiv();
  controlsWrap.parent(app);
  controlsWrap.style("display", "grid");
  controlsWrap.style("grid-template-columns", "repeat(2, minmax(220px, 1fr))");
  controlsWrap.style("gap", "10px");
  controlsWrap.style("max-width", "560px");
  controlsWrap.style("width", "100%");
  controlsWrap.style("margin", "12px auto");

  ui.styleToggle = createSelect();
  ui.styleToggle.option("Asian Style", "asian");
  ui.styleToggle.option("Western Style", "western");
  ui.styleToggle.changed(() => (currentStyle = ui.styleToggle.value()));
  labeled(ui.styleToggle, "Filter Style");

  ui.modeBtn = createButton("Mode: Manual Mouse");
  ui.modeBtn.mousePressed(toggleMode); 
  labeled(ui.modeBtn, "Tracking Mode");

  // Sliders
  ui.soft = createSlider(0, 10, 3, 0.5);
  labeled(ui.soft, "Softness");

  ui.pink = createSlider(0, 150, 60, 1);
  labeled(ui.pink, "Pink Tone");

  ui.scaleOverall = createSlider(0.25, 3.0, 1.0, 0.01);
  labeled(ui.scaleOverall, "Overall Scale");

  ui.scaleX = createSlider(0.2, 2.5, 1.0, 0.01);
  labeled(ui.scaleX, "Scale X (Horizontal)");

  ui.scaleY = createSlider(0.2, 2.5, 1.0, 0.01);
  labeled(ui.scaleY, "Scale Y (Vertical)");

  ui.rotDeg = createSlider(-45, 45, 0, 1);
  labeled(ui.rotDeg, "Overlay Rotation (°)");

  ui.alpha = createSlider(0, 255, 180, 1);
  labeled(ui.alpha, "Overlay Opacity");

  ui.whiteCut = createSlider(200, 255, 240, 1);
  labeled(ui.whiteCut, "Background Cut (whites → transparent)");

  // Snapshot button
  ui.snapBtn = createButton("📸 TAKE SNAPSHOT");
  ui.snapBtn.mousePressed(takesnap);
  ui.snapBtn.style("background-color", "#ff1493");
  ui.snapBtn.style("color", "white");
  ui.snapBtn.style("padding", "10px");
  labeled(ui.snapBtn, "Snapshot");

  // Gallery
  galleryWrap = createDiv();
  galleryWrap.parent(app);
  galleryWrap.style("max-width", "640px");
  galleryWrap.style("width", "100%");
  galleryWrap.style("margin", "18px auto");
  galleryWrap.style("display", "flex");
  galleryWrap.style("flex-wrap", "wrap");
  galleryWrap.style("gap", "10px");
  galleryWrap.style("justify-content", "center");

  // ---------------- Social Media Video Links ----------------
  createVideoLinks();

  // Text content at bottom
  textWrap = createDiv();
  textWrap.parent(app);
  textWrap.style("max-width", "640px");
  textWrap.style("width", "100%");
  textWrap.style("margin", "12px auto 30px");
  textWrap.style("color", "#ff1493");
  textWrap.style("font-family", "'Baloo 2', cursive");
  textWrap.style("font-size", "14px");
  textWrap.html(descriptionText + "<br><br>" + insightText + "<br><br>" + questionsText);

  processMasks();
  ui.whiteCut.input(processMasks);
}

// -------------------------- Draw --------------------------
function draw() {
  image(video, 0, 0, canvasW, canvasH);

  pgSoft.image(video, 0, 0, canvasW, canvasH);
  pgSoft.filter(BLUR, ui.soft.value());
  tint(255, 160);
  image(pgSoft, 0, 0);
  noTint();

  push();
  blendMode(SOFT_LIGHT);
  noStroke();
  fill(255, 140, 180, ui.pink.value());
  rect(0, 0, width, height);
  pop();

  let targetX = mouseX;
  let targetY = mouseY;
  let targetRot = radians(ui.rotDeg.value());
  let faceScaleX = 1.0;
  let faceScaleY = 1.0;

  if (autoFollow && tracker) {
    const positions = tracker.getCurrentPosition();
    if (positions && positions.length > 0) {
      targetX = positions[62][0];
      targetY = positions[62][1] - 20;

      const dx = positions[32][0] - positions[27][0];
      const dy = positions[32][1] - positions[27][1];
      targetRot = atan2(dy, dx);

      const leftX = positions[1][0], leftY = positions[1][1];
      const rightX = positions[13][0], rightY = positions[13][1];
      const topX = positions[24][0], topY = positions[24][1];
      const bottomX = positions[8][0], bottomY = positions[8][1];

      const faceW = dist(leftX, leftY, rightX, rightY);
      const faceH = dist(topX, topY, bottomX, bottomY);

      const baseImg = currentStyle === "asian" ? asianMasked : westernMasked;
      if (baseImg) {
        faceScaleX = faceW / baseImg.width;
        faceScaleY = faceH / baseImg.height;
      }
    }
  }

  overlayPos.x = lerp(overlayPos.x, targetX, 0.2);
  overlayPos.y = lerp(overlayPos.y, targetY, 0.2);

  const img = currentStyle === "asian" ? asianMasked : westernMasked;
  if (img) {
    push();
    translate(overlayPos.x, overlayPos.y);
    rotate(targetRot);
    imageMode(CENTER);
    tint(255, ui.alpha.value());

    const overall = ui.scaleOverall.value();
    const sx = overall * faceScaleX * ui.scaleX.value();
    const sy = overall * faceScaleY * ui.scaleY.value();

    image(img, 0, 0, img.width * sx, img.height * sy);
    pop();
  }

  drawEdgeEmojis();
}

// -------------------------- Social Media Links --------------------------
let videoLinks = [
  {url: "https://www.youtube.com/shorts/JhrNmsbdNLc", source: "YouTube Shorts: @jooshica6178"},
  {url: "https://www.youtube.com/shorts/5Ns3thgafJI", source: "YouTube Shorts: @HoneyRoseLoves"},
  {url: "https://www.youtube.com/watch?v=mOwmvnucewU", source: "YouTube: @Duo _ sis "},
  {url: "https://www.youtube.com/shorts/irNHLXMCbNQ", source: "YouTube Shorts: @ANDA"},
 {url: "https://editor.p5js.org/youna0000/full/JOl43DdaX", source: "My P-5js-sketch"}
];

function createVideoLinks() {
  videoSection = createDiv();
  videoSection.parent(app);
  videoSection.style("max-width", "640px");
  videoSection.style("width", "100%");
  videoSection.style("margin", "20px auto");
  videoSection.style("display", "flex");
  videoSection.style("flex-direction", "column");
  videoSection.style("gap", "6px");

  // Section main title
  const mainTitle = createP("YouTube content");
  mainTitle.parent(videoSection);
  mainTitle.style("font-weight", "bold");
  mainTitle.style("font-size", "18px");
  mainTitle.style("color", "#ff1493");
  mainTitle.style("font-family", "'Baloo 2', cursive");
  mainTitle.style("margin", "0 0 6px 0");

  // Section subtitle
  const sectionTitle = createP("Social Media content: trends on trying makeup styles from Different regions.");
  sectionTitle.parent(videoSection);
  sectionTitle.style("font-weight", "bold");
  sectionTitle.style("font-size", "16px");
  sectionTitle.style("color", "#ff1493");
  sectionTitle.style("font-family", "'Baloo 2', cursive");
  sectionTitle.style("margin", "0 0 10px 0");

  // Video links
  videoLinks.forEach(v => {
    const link = createA(v.url, v.url, "_blank");
    link.parent(videoSection);
    link.style("color", "#ff1493");
    link.style("font-family", "'Baloo 2', cursive");
    link.style("font-size", "14px");
    
    const source = createElement('small', "Source: " + v.source);
    source.parent(videoSection);
    source.style("color", "#ff1493");
    source.style("font-family", "'Baloo 2', cursive");
    source.style("font-size", "12px");
  });
}

// -------------------------- Labeled Controls --------------------------

function labeled(ctrl, labelText) {
  const group = createDiv();
  group.parent(controlsWrap);
  group.style("display", "flex");
  group.style("flex-direction", "column");
  group.style("gap", "6px");
  const labelElt = createSpan(labelText);
  labelElt.style("font-size", "13px");
  labelElt.style("color", "#ff1493");  
  labelElt.parent(group);
  ctrl.parent(group);
}


// -------------------------- Edge Emojis --------------------------
function drawEdgeEmojis() {
  const emojis = ["🐻", "🍓", "💄", "🎨", "✨"];
  push();
  textAlign(CENTER, CENTER);
  textSize(24);
  text(emojis[0], 22, 22);
  text(emojis[1], canvasW - 22, 22);
  text(emojis[2], 22, canvasH - 22);
  text(emojis[3], canvasW - 22, canvasH - 22);
  text(emojis[4], canvasW / 2, 22);
  pop();
}

// -------------------------- Masks & Snapshot --------------------------
function processMasks() {
  const thr = ui.whiteCut.value();
  if (asianRaw)   asianMasked   = applyTransparency(asianRaw, thr);
  if (westernRaw) westernMasked = applyTransparency(westernRaw, thr);
}

function applyTransparency(src, threshold) {
  const img = src.get();
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i], g = img.pixels[i+1], b = img.pixels[i+2];
    if (r>=threshold && g>=threshold && b>=threshold) img.pixels[i+3]=0;
  }
  img.updatePixels();
  return img;
}

function takesnap() {
  const shot = get();
  snaps.push(shot);
  const imgElt = createImg(shot.canvas.toDataURL());
  imgElt.parent(galleryWrap);
  imgElt.style("width","150px");
  imgElt.style("border","3px solid pink");
  imgElt.style("border-radius","10px");
}

// -------------------------- Text Content --------------------------
const descriptionText = 
"DESCRIPTION:\nThis sketch explores how digital beauty filters reshape our self‑perception by simulating algorithmic beauty standards in real time. Through subtle manipulations—such as smoothing, tinting, contouring, and regional presets—the sketch highlights how small adjustments can shift a face closer to different cultural ideals. By placing viewers in a filter‑driven environment similar to social media apps, the piece reveals how online aesthetics influence identity formation and prompt users to question what 'beauty' means when mediated by technology and trend cycles.";

const insightText = 
"INSIGHTS:\nDigital beauty standards aren’t neutral—they are constructed through social media culture, algorithmic optimization, influencer aesthetics, and region‑specific norms. This sketch allows users to see how these forces subtly guide facial expectations and shape what is perceived as 'ideal.' Filters encourage the performance of certain identities, smoothing away perceived flaws and reinforcing narrow aesthetics that circulate globally.";

const questionsText = 
"REFLECTION QUESTIONS:\n• Which choices felt authentic, and which felt influenced by online norms?\n• How do filters change how you feel about your real appearance?\n• Why do certain features signal 'idealness' in some cultures but not others?\n• How much of your preference is personal vs. algorithmically shaped?";





