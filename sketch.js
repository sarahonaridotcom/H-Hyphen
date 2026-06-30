// =============================================================
// HYPHEN — Final Website Sketch v5 (thumbnail expand fixed)
// =============================================================

const MODELS = [
  { obj: 'Models/Drevo_About.obj',       tex: 'Models/Drevo_About.png',      section: 'ABOUT',   label: 'ABOUT'   },
  { obj: 'Models/Pine_LineUp.obj',       tex: 'Models/Pine_LineUp.png',       section: 'LINEUP',  label: 'LINEUP'  },
  { obj: 'Models/Butterfly_Tickets.obj', tex: 'Models/Butterfly_Tickets.png', section: 'TICKETS', label: 'TICKETS' },
  { obj: 'Models/WoodenBench_Space.obj', tex: 'Models/WoodenBench_Space.jpg', section: 'SPACE',   label: 'SPACE'   },
  { obj: 'Models/Rock_Shop.obj',         tex: 'Models/Rock_Shop.png',         section: 'SHOP',    label: 'SHOP'    },
  { obj: 'Models/Leaf_Archive.obj',      tex: 'Models/Leaf_Archive.jpg',      section: 'ARCHIVE', label: 'ARCHIVE' },
];

const MODEL_POSITIONS = [
  { nx: 0.18, ny: 0.22 },
  { nx: 0.44, ny: 0.38 },
  { nx: 0.60, ny: 0.56 },
  { nx: 0.80, ny: 0.20 },
  { nx: 0.22, ny: 0.72 },
  { nx: 0.76, ny: 0.75 },
];

const MODEL_BASE_ROT = [
  [0.4,   1.2],
  [0.1,   0.0],
  [0.0,   0.5],
  [3.14159, 0.3],
  [3.14159, 0.2],
  [0.1,   0.3],
];

function getSectionThumbs(section) {
  const W=110, H=78;
  if (section==='LINEUP') return [
    {angle:-0.9, dist:280, w:W,    h:H, label:'DAY 1 · 21.07'},
    {angle: 0.4, dist:260, w:W,    h:H, label:'DAY 2 · 22.07'},
    {angle: 2.1, dist:300, w:W+10, h:H, label:'DAY 3 · 23.07'},
  ];
  if (section==='TICKETS') return [
    {angle:-2.4, dist:270, w:W,    h:H, label:'SINGLE DAY'},
    {angle: 0.3, dist:250, w:W+20, h:H, label:'FULL PASS'},
  ];
  if (section==='ABOUT') return [
    {angle:-0.9, dist:260, w:W+20, h:H, label:'CONCEPT'},
    {angle: 0.6, dist:280, w:W+20, h:H, label:'MANIFESTO'},
  ];
  if (section==='SPACE') return [
    {angle:-1.1, dist:290, w:W+30, h:H, label:'PARCO ALLE FORNACI'},
    {angle: 1.0, dist:260, w:W+30, h:H, label:'21010 CASTELVECCANA'},
  ];
  if (section==='SHOP') return [
    {angle:-2.6, dist:255, w:W,    h:H, label:'APPAREL'},
    {angle: 0.5, dist:270, w:W,    h:H, label:'ACCESSORIES'},
    {angle: 2.3, dist:285, w:W,    h:H, label:'PRINTS'},
  ];
  if (section==='ARCHIVE') return [
    {angle:-0.7, dist:265, w:W,    h:H, label:'2025 EDITION'},
    {angle: 2.0, dist:275, w:W+20, h:H, label:'DOCUMENTATION'},
  ];
  return [];
}

function getThumbContent(section, thumbIndex) {
  if (section==='ABOUT') {
    if (thumbIndex===0) return [
      'HYPHEN is an experimental music festival',
      'built on the metaphor of the mycelium network —',
      'an underground fungal system that connects',
      'organisms and distributes nutrients and information.',
      '',
      'The festival occupies abandoned spaces where nature',
      'reclaims man-made structures, rehabilitating them',
      'into domains of art and community.',
    ];
    if (thumbIndex===1) return [
      'From the word HYPHA — individual fungal branches.',
      '',
      'A hyphen joins syllables and words the same way',
      'the festival joins arts, philosophy, and politics.',
      '',
      'Organic. Interconnected. Adaptive.',
      'Exploratory. Rehabilitative.',
    ];
  }
  return ['Content coming soon.'];
}

// ── State ──────────────────────────────────────────────────────
let stage = 1;
let stageTimer = 0;
let font, logoHH, logoHyphen;
let modelData = [];
let modelsLoaded = 0;
let setupDone = false;
let pendingThumbBake = [];
const TOTAL_MODELS = MODELS.length;

let filaments = [];
const FILAMENT_COUNT = 40;

let logo_driftX, logo_driftY, logo_driftVX, logo_driftVY;
const LOGOHH_W=90, LOGOHH_H=45;
const LOGOHYP_W=180, LOGOHYP_H=55;

const PARTICLES_PER_MODEL = 600;
const REVEAL_RADIUS = 210;
let assembledFlags = [];
let advanceToStage3 = false;

let hoverScale = [];
let selectedModel = -1;
let labelAngle = [];

let expandT = 0;
let rotX=0, rotY=0, targetRotX=0, targetRotY=0;
const LERP_SPD=0.07;
let zoomVal=1.0, targetZoom=1.0;

// Thumbnail expand — which thumb index is expanded (-1 = none)
let expandedThumb = -1;
let thumbExpandT   = 0;
// Screen-space position of each thumb, filled each frame so clicks work
let thumbScreenPos = []; // array of {sx, sy, tw, th} per thumb

let thumbGraphics = [];

const RING_TEXT  = 'AN EXPLORATION OF PAST AND FUTURE RUINS · ';
const RING_RX=240, RING_RZ=120, RING_TILT=0.28, RING_SPEED=0.003;
let ringOffset=0;

// ── preload ────────────────────────────────────────────────────
function preload() {
  font       = loadFont('SteviesSans-Book.ttf');
  logoHH     = loadImage('Logo/Logo_HH.png');
  logoHyphen = loadImage('Logo/Logo_Hyphen.png');

  for (let i=0; i<MODELS.length; i++) {
    modelData.push({obj:null,tex:null,ready:false,
                    particles:[],scaleVal:1,cx:0,cy:0,cz:0,maxRange:1});
    assembledFlags.push(false);
    thumbGraphics.push([]);
    labelAngle.push(random(6.2832));

    loadModel(MODELS[i].obj, true,
      (m)  =>{modelData[i].obj=m;   tryFinalize(i);},
      ()   =>console.warn('OBJ failed:',MODELS[i].obj));
    loadImage(MODELS[i].tex,
      (img)=>{modelData[i].tex=img;  tryFinalize(i);},
      ()   =>console.warn('TEX failed:',MODELS[i].tex));
  }
}

function tryFinalize(i) {
  if (modelData[i].obj && modelData[i].tex) {
    initModelGeometry(i);
    modelData[i].ready = true;
    modelsLoaded++;
    if (setupDone) bakeThumbGraphics(i);
    else pendingThumbBake.push(i);
  }
}

// ── setup ──────────────────────────────────────────────────────
function setup() {
  let cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.parent('canvas-host');
  pixelDensity(1);
  noCursor();
  ortho(-width/2, width/2, -height/2, height/2, -10000, 10000);
  textFont(font);
  hoverScale = new Array(MODELS.length).fill(1.0);
  buildFilaments();
  initDriftLogo();
  setupDone = true;
  for (let i of pendingThumbBake) bakeThumbGraphics(i);
  pendingThumbBake = [];
  // Warmup all textures immediately in setup — happens during initial load
  // so every stage transition is instant
  push();
  translate(-99999,-99999,0);
  for(let i=0;i<MODELS.length;i++){
    let m=modelData[i]; if(!m.ready) continue;
    texture(m.tex); noStroke(); scale(0.0001); model(m.obj);
  }
  pop();
}

function initDriftLogo() {
  logo_driftX = random(-width*0.2, width*0.2);
  logo_driftY = random(-height*0.3, height*0.3);
  logo_driftVX = random(1.4,2.2)*(random()>0.5?1:-1);
  logo_driftVY = random(1.0,1.6)*(random()>0.5?1:-1);
}

function updateDriftLogo(w,h) {
  logo_driftX+=logo_driftVX; logo_driftY+=logo_driftVY;
  if(logo_driftX> width/2-w/2){logo_driftX= width/2-w/2;logo_driftVX*=-1;}
  if(logo_driftX<-width/2+w/2){logo_driftX=-width/2+w/2;logo_driftVX*=-1;}
  if(logo_driftY> height/2-h/2){logo_driftY= height/2-h/2;logo_driftVY*=-1;}
  if(logo_driftY<-height/2+h/2){logo_driftY=-height/2+h/2;logo_driftVY*=-1;}
}

// ── Model geometry ─────────────────────────────────────────────
function initModelGeometry(i) {
  let m=modelData[i];
  let raw=m.obj.vertices;
  if(!raw||raw.length===0) return;
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(let v of raw){
    if(v.x<minX)minX=v.x;if(v.x>maxX)maxX=v.x;
    if(v.y<minY)minY=v.y;if(v.y>maxY)maxY=v.y;
    if(v.z<minZ)minZ=v.z;if(v.z>maxZ)maxZ=v.z;
  }
  let rx=maxX-minX,ry=maxY-minY,rz=maxZ-minZ;
  m.maxRange=max(rx,ry,rz);
  m.cx=minX+rx/2;m.cy=minY+ry/2;m.cz=minZ+rz/2;
  m.scaleVal=180/m.maxRange;
  m.particles=[];
  let step=max(1,floor(raw.length/PARTICLES_PER_MODEL));
  let count=0;
  for(let j=0;j<raw.length&&count<PARTICLES_PER_MODEL;j+=step){
    let v=raw[j];
    let px=(v.x-m.cx)*m.scaleVal;
    let py=(v.y-m.cy)*m.scaleVal;
    let pz=(v.z-m.cz)*m.scaleVal;
    let angle=random(6.2832);
    let dist=random(180,max(width,height)*0.52);
    m.particles.push({hx:px,hy:py,hz:pz,
                      sx:px+cos(angle)*dist,
                      sy:py+sin(angle)*dist,
                      sz:pz+random(-120,120),dispT:1.0});
    count++;
  }
}

function bakeThumbGraphics(i) {
  let m=modelData[i];
  let thumbDefs=getSectionThumbs(MODELS[i].section);
  thumbGraphics[i]=[];
  for(let ti=0;ti<thumbDefs.length;ti++){
    let g=createGraphics(220,154,WEBGL);
    g.pixelDensity(1);
    g.ortho(-55,55,-55,55,-5000,5000);
    g.background(18,18,18);
    g.push();
    g.rotateX(MODEL_BASE_ROT[i][0]+ti*0.3);
    g.rotateY(MODEL_BASE_ROT[i][1]+ti*0.55);
    g.texture(m.tex);g.noStroke();
    g.scale(m.scaleVal);g.model(m.obj);
    g.pop();
    thumbGraphics[i].push(g);
  }
}

// ── Filaments ──────────────────────────────────────────────────
function buildFilaments() {
  filaments=[];
  for(let k=0;k<FILAMENT_COUNT;k++){
    let a=floor(random(MODELS.length));
    let b=floor(random(MODELS.length));
    while(b===a) b=floor(random(MODELS.length));
    filaments.push({
      modelA:a,modelB:b,
      cp1x:random(-180,180),cp1y:random(-140,140),
      cp2x:random(-180,180),cp2y:random(-140,140),
      alpha:0,targetAlpha:random(55,120),
      speed:random(0.006,0.014),phase:random(6.2832),sw:random(0.3,0.9)
    });
  }
}

// ── draw ───────────────────────────────────────────────────────
function draw() {
  background(0);
  rotX=lerp(rotX,targetRotX,LERP_SPD);
  rotY=lerp(rotY,targetRotY,LERP_SPD);
  zoomVal=lerp(zoomVal,targetZoom,LERP_SPD);
  stageTimer++;

  if(advanceToStage3){advanceToStage3=false;goToStage(3);return;}

  // Loading screen — shown until all models are ready
  if(modelsLoaded < TOTAL_MODELS){
    drawTextLayer_2D(()=>{
      let dots = '.'.repeat((floor(frameCount/20) % 3) + 1);
      fill(255,255,255,180); noStroke();
      textSize(13); textStyle(BOLD); textAlign(CENTER,CENTER);
      text('HYPHEN', 0, -20);
      textStyle(NORMAL);
      fill(255,255,255,120);
      textSize(11);
      text('LOADING' + dots, 0, 10);
      // Progress bar
      let prog = modelsLoaded / TOTAL_MODELS;
      let barW = 160;
      stroke(255,255,255,60); strokeWeight(0.5); noFill();
      rect(-barW/2, 30, barW, 2);
      noStroke(); fill(255,255,255,180);
      rect(-barW/2, 30, barW*prog, 2);
    });
    return;
  }

  if     (stage===1) drawStage1();
  else if(stage===2) drawStage2();
  else if(stage===3) drawStage3();
  else if(stage===4) drawStage4();
}

// ══════════════════════════════════════════════════════════════
// STAGE 1
// ══════════════════════════════════════════════════════════════
function drawStage1() {
  for(let f of filaments) f.alpha=lerp(f.alpha,f.targetAlpha,0.06);
  drawMyceliumFilaments(1.0);
  drawAllModelClouds_fixed(0.0,0.5);
  updateDriftLogo(LOGOHH_W,LOGOHH_H);
  drawTextLayer_2D(()=>{
    if(logoHH) image(logoHH,logo_driftX-LOGOHH_W/2,logo_driftY-LOGOHH_H/2,LOGOHH_W,LOGOHH_H);
    let a=map(sin(stageTimer*0.04),-1,1,140,255);
    fill(255,255,255,a);noStroke();
    textSize(18);textStyle(BOLD);textAlign(CENTER,CENTER);
    text('INFECTION HAS BEEN MADE. CLICK TO ENTER THE DECOMPOSITION.',0,height*0.42);
    textStyle(NORMAL);
    fill(255,255,255,200);noStroke();
    circle(mouseX-width/2,mouseY-height/2,5);
  });
}

// ══════════════════════════════════════════════════════════════
// STAGE 2
// ══════════════════════════════════════════════════════════════
function drawStage2() {
  let mx=mouseX-width/2, my=mouseY-height/2;
  let allDone=true;
  for(let i=0;i<MODELS.length;i++){
    let m=modelData[i]; if(!m.ready){allDone=false;continue;}
    if(assembledFlags[i]) continue;
    let pos=modelScreenPos(i);
    let fullyAssembled=true;
    for(let p of m.particles){
      let curX=lerp(p.hx+pos.x,p.sx+pos.x,p.dispT);
      let curY=lerp(p.hy+pos.y,p.sy+pos.y,p.dispT);
      let d=sqrt((mx-curX)*(mx-curX)+(my-curY)*(my-curY));
      if(d<REVEAL_RADIUS) p.dispT=max(0,p.dispT-0.09);
      if(p.dispT>0.05) fullyAssembled=false;
    }
    if(fullyAssembled) assembledFlags[i]=true;
    else allDone=false;
  }
  drawAllModelClouds_interpolated(0.9);
  updateDriftLogo(LOGOHH_W,LOGOHH_H);
  drawTextLayer_2D(()=>{
    if(logoHH) image(logoHH,logo_driftX-LOGOHH_W/2,logo_driftY-LOGOHH_H/2,LOGOHH_W,LOGOHH_H);
    let a=map(sin(stageTimer*0.03),-1,1,100,220);
    fill(255,255,255,a);noStroke();
    textSize(18);textStyle(BOLD);textAlign(CENTER,CENTER);
    text('MOVE ACROSS THE SCREEN TO ASSEMBLE',0,height*0.44);
    textStyle(NORMAL);
    if(logoHyphen){
      let lw=LOGOHYP_W,lh=lw*(logoHyphen.height/logoHyphen.width);
      image(logoHyphen,mx-lw/2,my-lh/2,lw,lh);
    }
  });
  if(allDone&&modelsLoaded===TOTAL_MODELS) advanceToStage3=true;
}

// ══════════════════════════════════════════════════════════════
// STAGE 3
// ══════════════════════════════════════════════════════════════
function drawStage3() {
  ringOffset+=RING_SPEED;
  updateDriftLogo(LOGOHH_W,LOGOHH_H);

  for(let i=0;i<MODELS.length;i++){
    let m=modelData[i]; if(!m.ready) continue;
    let pos=modelScreenPos(i);
    let dx=mouseX-width/2-pos.x, dy=mouseY-height/2-pos.y;
    let d=sqrt(dx*dx+dy*dy);
    let targetS=(d<140)?2.2:1.0;
    hoverScale[i]=lerp(hoverScale[i],targetS,0.08);

    push();
    translate(pos.x,pos.y,0);
    let br=MODEL_BASE_ROT[i];
    rotateX(br[0]+rotX*0.4);
    rotateY(br[1]+rotY*0.4);
    texture(m.tex);noStroke();
    scale(m.scaleVal*hoverScale[i]);
    model(m.obj);
    pop();

    drawRingText3D(pos.x,pos.y,hoverScale[i]*0.85);

    labelAngle[i]+=0.008;
    let labelR=145*hoverScale[i];
    let lx=pos.x+cos(labelAngle[i])*labelR;
    let ly=pos.y+sin(labelAngle[i])*labelR*0.38;
    drawTextLayer_2D(()=>{
      fill(255);noStroke();textSize(17);textStyle(BOLD);textAlign(CENTER,CENTER);
      text(MODELS[i].label,lx,ly);
      textStyle(NORMAL);
    });
  }

  drawTextLayer_2D(()=>{
    if(logoHH) image(logoHH,logo_driftX-LOGOHH_W/2,logo_driftY-LOGOHH_H/2,LOGOHH_W,LOGOHH_H);
    let mx=mouseX-width/2,my=mouseY-height/2;
    if(logoHyphen){
      let lw=LOGOHYP_W,lh=lw*(logoHyphen.height/logoHyphen.width);
      image(logoHyphen,mx-lw/2,my-lh/2,lw,lh);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// STAGE 4
// ══════════════════════════════════════════════════════════════
function drawStage4() {
  ringOffset+=RING_SPEED;
  expandT=min(1.0,expandT+0.03);
  if(expandedThumb>=0) thumbExpandT=min(1.0,thumbExpandT+0.06);

  let i=selectedModel;
  let m=modelData[i]; if(!m.ready) return;
  let t=easeInOut(expandT);
  let originPos=modelScreenPos(i);
  let cx=lerp(originPos.x,0,t);
  let cy=lerp(originPos.y,0,t);
  let sc=lerp(m.scaleVal*hoverScale[i],m.scaleVal*2.8*zoomVal,t);
  let br=MODEL_BASE_ROT[i];

  for(let j=0;j<MODELS.length;j++){
    if(j===i) continue;
    let mj=modelData[j]; if(!mj.ready) continue;
    let fa=max(0,1.0-t*2.2); if(fa<=0) continue;
    let pos=modelScreenPos(j);
    push();translate(pos.x,pos.y,0);
    tint(255,fa*110);texture(mj.tex);noStroke();
    scale(mj.scaleVal);model(mj.obj);noTint();
    pop();
  }

  push();
  translate(cx,cy,0);
  rotateX(br[0]+rotX);rotateY(br[1]+rotY);
  scale(sc);texture(m.tex);noStroke();model(m.obj);
  pop();

  if(expandT>0.5) drawRingText3D(cx,cy,lerp(0.9,2.4,t));

  // Reset thumb screen positions each frame
  thumbScreenPos = [];
  if(expandT>0.7){
    let thumbA=map(expandT,0.7,1.0,0,255);
    drawThumbnailsBillboard(i,cx,cy,sc,br,thumbA);
  }

  let mx=mouseX-width/2, my=mouseY-height/2;
  drawTextLayer_2D(()=>{
    let labelA=lerp(0,255,expandT);
    fill(255,255,255,labelA);noStroke();
    textSize(17);textStyle(BOLD);textAlign(CENTER,CENTER);
    text(MODELS[i].label,0,-height/2+58);textStyle(NORMAL);

    fill(255,255,255,210);textSize(16);textStyle(BOLD);textAlign(LEFT,CENTER);
    text('← BACK',-width/2+28,-height/2+30);textStyle(NORMAL);

    if(logoHH){
      let lw=72,lh=lw*(logoHH.height/logoHH.width);
      image(logoHH,mx-lw/2,my-lh/2,lw,lh);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// BILLBOARDED THUMBNAILS — with expand-in-place
// ══════════════════════════════════════════════════════════════
function drawThumbnailsBillboard(modelIndex,cx,cy,sc,br,alpha){
  let thumbDefs=getSectionThumbs(MODELS[modelIndex].section);
  let rx=br[0]+rotX, ry=br[1]+rotY;

  for(let ti=0;ti<thumbDefs.length;ti++){
    let td=thumbDefs[ti];

    // Rotate anchor point with model
    let lxT=cos(td.angle)*td.dist;
    let lyT=sin(td.angle)*td.dist;
    let x2= lxT*cos(ry); let y2= lyT; let z2=-lxT*sin(ry);
    let tx2=x2; let ty2=y2*cos(rx)-z2*sin(rx);
    let tsx=cx+tx2*sc*0.5;
    let tsy=cy+ty2*sc*0.5;

    // Line start (closer to model)
    let lxA=cos(td.angle)*td.dist*0.45;
    let lyA=sin(td.angle)*td.dist*0.45;
    let x1= lxA*cos(ry); let y1= lyA; let z1=-lxA*sin(ry);
    let ax=x1; let ay=y1*cos(rx)-z1*sin(rx);
    let asx=cx+ax*sc*0.5; let asy=cy+ay*sc*0.5;

    let isExpanded=(expandedThumb===ti);
    let et=isExpanded ? easeInOut(thumbExpandT) : 0;

    // Base size vs expanded size
    let baseW=td.w, baseH=td.h;
    let bigW=baseW*2.6, bigH=baseH*2.8;
    let drawW=lerp(baseW, bigW, et);
    let drawH=lerp(baseH, bigH, et);

    // Store for click detection (always base hitbox)
    thumbScreenPos.push({sx:tsx, sy:tsy, tw:baseW, th:baseH, ti:ti});

    drawTextLayer_2D(()=>{
      // Connector line (hide when expanded)
      if(et<0.5){
        stroke(255,255,255,alpha*0.5*(1-et*2));strokeWeight(0.7);
        line(asx,asy,tsx,tsy);
      }

      // Thumbnail image (render)
      if(thumbGraphics[modelIndex]&&thumbGraphics[modelIndex][ti]){
        tint(255,alpha*0.65);
        image(thumbGraphics[modelIndex][ti],tsx-drawW/2,tsy-drawH/2,drawW,drawH);
        noTint();
      } else {
        fill(18,18,18,alpha*0.85);noStroke();
        rect(tsx-drawW/2,tsy-drawH/2,drawW,drawH);
      }

      // Border
      noFill();stroke(255,255,255,alpha*0.9);strokeWeight(0.9);
      rect(tsx-drawW/2,tsy-drawH/2,drawW,drawH);

      if(!isExpanded || thumbExpandT<0.1){
        // Collapsed: just label centred
        noStroke();fill(255,255,255,alpha);
        textSize(12);textStyle(BOLD);textAlign(CENTER,CENTER);
        text(td.label,tsx,tsy);
        textStyle(NORMAL);
      } else {
        // Expanded: title + divider + body text
        let bodyA=map(thumbExpandT,0.3,0.8,0,alpha);

        // Title top
        noStroke();fill(255,255,255,alpha);
        textSize(13);textStyle(BOLD);textAlign(CENTER,TOP);
        text(td.label, tsx, tsy-drawH/2+14);
        textStyle(NORMAL);

        // Divider
        stroke(255,255,255,alpha*0.35);strokeWeight(0.6);
        line(tsx-drawW/2+18, tsy-drawH/2+34, tsx+drawW/2-18, tsy-drawH/2+34);

        // Body text
        let content=getThumbContent(MODELS[modelIndex].section,ti);
        noStroke();fill(255,255,255,bodyA);
        textSize(11);textStyle(NORMAL);
        textAlign(LEFT,TOP);textLeading(17);
        text(content.join('\n'), tsx-drawW/2+18, tsy-drawH/2+42, drawW-36, drawH-60);

        // Close hint
        fill(255,255,255,alpha*0.4);
        textSize(10);textAlign(CENTER,BOTTOM);
        text('CLICK TO CLOSE', tsx, tsy+drawH/2-10);
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════
// RING TEXT — readable direction
// ══════════════════════════════════════════════════════════════
function drawRingText3D(cx,cy,sizeScale){
  let chars=RING_TEXT.split('');
  let total=chars.length;
  let rx=RING_RX*sizeScale, rz=RING_RZ*sizeScale;
  push();
  translate(cx,cy,0);
  rotateX(RING_TILT);
  for(let j=0;j<total;j++){
    let angle=(6.2832/total)*j + ringOffset;
    let x3=cos(angle)*rx, z3=sin(angle)*rz;
    let depth=map(z3,-rz,rz,0,1);
    let sz=map(depth,0,1,7,11)*sizeScale;
    let a=map(depth,0,1,90,220);
    push();
    translate(x3,0,z3);
    rotateY(-angle);
    noStroke();fill(255,255,255,a);
    textSize(sz);textAlign(CENTER,CENTER);
    text(chars[j],0,0);
    pop();
  }
  pop();
}

// ── Shared helpers ─────────────────────────────────────────────
function drawAllModelClouds_fixed(dv,baseAlpha){
  for(let i=0;i<MODELS.length;i++){
    let m=modelData[i];if(!m.ready)continue;
    let pos=modelScreenPos(i);
    push();translate(pos.x,pos.y,0);noStroke();
    for(let p of m.particles){
      fill(255,255,255,baseAlpha*255);
      circle(lerp(p.hx,p.sx,dv),lerp(p.hy,p.sy,dv),2.0);
    }
    pop();
  }
}

function drawAllModelClouds_interpolated(baseAlpha){
  for(let i=0;i<MODELS.length;i++){
    let m=modelData[i];if(!m.ready)continue;
    let pos=modelScreenPos(i);
    push();translate(pos.x,pos.y,0);noStroke();
    for(let p of m.particles){
      let a=lerp(230,60,p.dispT);
      fill(255,255,255,a*baseAlpha);
      circle(lerp(p.hx,p.sx,p.dispT),lerp(p.hy,p.sy,p.dispT),2.0);
    }
    pop();
  }
}

function drawMyceliumFilaments(ga){
  noFill();
  for(let f of filaments){
    if(f.alpha<2)continue;
    let pa=modelScreenPos(f.modelA),pb=modelScreenPos(f.modelB);
    let pulse=sin(frameCount*f.speed+f.phase);
    let a=f.alpha*ga*map(pulse,-1,1,0.55,1.0);
    stroke(255,255,255,a);strokeWeight(f.sw);
    beginShape();
    vertex(pa.x,pa.y);
    bezierVertex(pa.x+f.cp1x,pa.y+f.cp1y,pb.x+f.cp2x,pb.y+f.cp2y,pb.x,pb.y);
    endShape();
  }
}

function drawTextLayer_2D(fn){
  push();
  ortho(-width/2,width/2,-height/2,height/2,-10000,10000);
  resetMatrix();fn();
  pop();
}

function modelScreenPos(i){
  let np=MODEL_POSITIONS[i];
  return {x:(np.nx-0.5)*width, y:(np.ny-0.5)*height};
}

function easeInOut(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}

// ── Transitions ────────────────────────────────────────────────
function goToStage(s){
  stage=s; stageTimer=0;
  if(s===2){
    for(let m of modelData) for(let p of m.particles) p.dispT=1.0;
    for(let i=0;i<MODELS.length;i++) assembledFlags[i]=false;
  }
  if(s===3){
    hoverScale.fill(1.0);
    rotX=0;rotY=0;targetRotX=0;targetRotY=0;
    zoomVal=1.0;targetZoom=1.0;
    initDriftLogo();
  }
  if(s===4){expandT=0;zoomVal=1.0;targetZoom=1.0;expandedThumb=-1;thumbExpandT=0;thumbScreenPos=[];}
}

// ── Input ──────────────────────────────────────────────────────
function mousePressed(){
  if(stage===1){goToStage(2);return;}

  if(stage===3){
    for(let i=0;i<MODELS.length;i++){
      let m=modelData[i];if(!m.ready)continue;
      let pos=modelScreenPos(i);
      let dx=mouseX-width/2-pos.x,dy=mouseY-height/2-pos.y;
      if(sqrt(dx*dx+dy*dy)<140*hoverScale[i]){selectedModel=i;goToStage(4);return;}
    }
    return;
  }

  if(stage===4){
    // Close expanded thumb on any click
    if(expandedThumb>=0){expandedThumb=-1;thumbExpandT=0;return;}

    // Back button
    if(mouseX<200&&mouseY<60){goToStage(3);return;}

    // Check thumb clicks using stored screen positions
    if(expandT>=0.95 && thumbScreenPos.length>0){
      let mx2=mouseX-width/2, my2=mouseY-height/2;
      for(let entry of thumbScreenPos){
        if(mx2>entry.sx-entry.tw/2 && mx2<entry.sx+entry.tw/2 &&
           my2>entry.sy-entry.th/2 && my2<entry.sy+entry.th/2){
          expandedThumb=entry.ti;
          thumbExpandT=0;
          return;
        }
      }
    }
  }
}

function mouseDragged(){
  if(stage===3||stage===4){
    targetRotY+=(mouseX-pmouseX)*0.005;
    targetRotX+=(mouseY-pmouseY)*0.005;
  }
}

function mouseWheel(event){
  if(stage===4){targetZoom-=event.delta*0.001;targetZoom=constrain(targetZoom,0.3,4.0);}
  else if(stage===3){targetRotY+=event.delta*0.002;targetRotX+=event.delta*0.0005;}
  return false;
}

function windowResized(){
  resizeCanvas(windowWidth,windowHeight);
  ortho(-width/2,width/2,-height/2,height/2,-10000,10000);
}