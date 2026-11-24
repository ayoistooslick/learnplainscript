import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/* ------------------------------------------------------------------
   A small, deliberately low-poly classroom built with Three.js.

   It is a real 3D scene, not a video or a stack of CSS layers: a
   perspective camera, directional and point lights, shadow casting,
   canvas-painted chalk and notebook textures, and a damped pointer
   parallax. It is lazily loaded, renders only while visible, caps the
   device pixel ratio, and stops animating under prefers-reduced-motion.
------------------------------------------------------------------- */

const PAPER = '#efe6d6';
const PAPER_FLOOR = '#d8cbb4';
const WOOD = '#a9835b';
const WOOD_DARK = '#8a6a48';
const CHALKBOARD = '#252B29';
const CHALK = 'rgba(232, 239, 230, 0.92)';
const CHALK_DIM = 'rgba(232, 239, 230, 0.55)';
const MINT = 'rgba(217, 231, 210, 0.92)';
const AMBER = 'rgba(240, 200, 130, 0.92)';
const CORAL = 'rgba(232, 146, 122, 0.95)';

function makeChalkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const draw = () => {
    ctx.fillStyle = CHALKBOARD;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // chalk dust
    for (let i = 0; i < 900; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
      ctx.fillRect(x, y, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }

    ctx.textBaseline = 'middle';
    ctx.fillStyle = CHALK_DIM;
    ctx.font = "26px 'IBM Plex Mono', monospace";
    ctx.fillText('CHAPTER 01 / VALUES', 70, 70);

    ctx.fillStyle = CHALK;
    ctx.font = "72px 'Caveat', cursive";
    ctx.fillText('A name is a handle to a value.', 70, 150);

    ctx.fillStyle = AMBER;
    ctx.font = "54px 'Caveat', cursive";
    ctx.fillText('value name is "Ada"', 70, 238);

    ctx.strokeStyle = CHALK_DIM;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 275);
    ctx.lineTo(640, 275);
    ctx.stroke();

    // flow diagram
    ctx.strokeStyle = MINT;
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 330, 250, 92);
    ctx.strokeRect(430, 330, 220, 92);
    ctx.strokeRect(760, 330, 250, 92);
    ctx.fillStyle = CHALK;
    ctx.font = "24px 'IBM Plex Mono', monospace";
    ctx.fillText('value', 160, 362);
    ctx.fillText('name', 165, 398);
    ctx.fillText('checker', 486, 362);
    ctx.fillText('text', 508, 398);
    ctx.fillText('print(name)', 792, 362);
    ctx.fillText('Ada', 848, 398);

    ctx.strokeStyle = CORAL;
    ctx.lineWidth = 3;
    const arrow = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 12, y2 - 7);
      ctx.lineTo(x2 - 12, y2 + 7);
      ctx.closePath();
      ctx.fillStyle = CORAL;
      ctx.fill();
    };
    arrow(320, 376, 424, 376);
    arrow(650, 376, 754, 376);

    ctx.fillStyle = MINT;
    ctx.font = "40px 'Caveat', cursive";
    ctx.fillText('the checker reads the type before the program runs', 70, 520);

    ctx.fillStyle = CHALK_DIM;
    ctx.font = "24px 'IBM Plex Mono', monospace";
    ctx.fillText('print(name)  →  Ada', 70, 600);

    // hand-drawn underline
    ctx.strokeStyle = CORAL;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(74, 612);
    ctx.quadraticCurveTo(240, 620, 402, 610);
    ctx.stroke();
  };
  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => { draw(); texture.needsUpdate = true; }).catch(() => {});
  }
  return texture;
}

function makeNotebookTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 440;
  const ctx = canvas.getContext('2d');
  const draw = () => {
    ctx.fillStyle = '#f5f0e6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(107, 99, 88, 0.22)';
    ctx.lineWidth = 1;
    for (let y = 54; y < canvas.height; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(201, 100, 66, 0.45)';
    ctx.beginPath();
    ctx.moveTo(58, 0);
    ctx.lineTo(58, canvas.height);
    ctx.stroke();
    ctx.fillStyle = '#25231f';
    ctx.font = "34px 'Caveat', cursive";
    ctx.fillText('value x is 42', 86, 92);
    ctx.fillStyle = '#8b5e3c';
    ctx.fillText('print("x is {x}")', 86, 146);
    ctx.fillStyle = '#6b6358';
    ctx.font = "26px 'Caveat', cursive";
    ctx.fillText('→ x is 42', 86, 200);
    ctx.fillStyle = '#25231f';
    ctx.font = "24px 'Caveat', cursive";
    ctx.fillText('One readable spelling per idea.', 86, 300);
  };
  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => { draw(); texture.needsUpdate = true; }).catch(() => {});
  }
  return texture;
}

export default function ClassroomScene({ className = '' }) {
  const hostRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return undefined;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e0d1');
    scene.fog = new THREE.Fog('#e9e0d1', 9, 19);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    camera.position.set(0, 2.25, 6.4);

    scene.add(new THREE.HemisphereLight('#fff8ea', '#8a7d68', 1.15));

    const sun = new THREE.DirectionalLight('#ffe9c8', 2.1);
    sun.position.set(-4.5, 6.5, 4.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -4;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 20;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const lamp = new THREE.PointLight('#ffd7a0', 14, 9, 2);
    lamp.position.set(1.9, 3.1, 1.2);
    scene.add(lamp);

    const material = (color, roughness = 0.9, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });

    const mesh = (geometry, materialOrColor, { x = 0, y = 0, z = 0, cast = false, receive = false } = {}) => {
      const object = new THREE.Mesh(geometry, typeof materialOrColor === 'string' ? material(materialOrColor) : materialOrColor);
      object.position.set(x, y, z);
      object.castShadow = cast;
      object.receiveShadow = receive;
      scene.add(object);
      return object;
    };

    // floor and back wall
    mesh(new THREE.PlaneGeometry(22, 22), material(PAPER_FLOOR, 0.96), { y: 0, receive: true }).rotation.x = -Math.PI / 2;
    mesh(new THREE.PlaneGeometry(18, 9), material(PAPER, 0.98), { y: 4.5, z: -3.6, receive: true });
    mesh(new THREE.BoxGeometry(18, 0.24, 0.2), material('#cbbda4', 0.95), { y: 0.12, z: -3.5, receive: true });
    mesh(new THREE.BoxGeometry(18, 0.14, 1.4), material('#c9b99e', 0.97), { y: 0, z: -2.9, receive: true });

    // light switch and wall fittings keep the wall from reading as a backdrop
    mesh(new THREE.BoxGeometry(0.22, 0.34, 0.05), material('#efe7d8', 0.7), { x: 5.4, y: 1.65, z: -3.45 });
    mesh(new THREE.BoxGeometry(0.3, 0.5, 0.06), material('#efe7d8', 0.7), { x: -5.6, y: 2.2, z: -3.45 });

    // chalkboard
    const board = new THREE.Group();
    board.position.set(-0.55, 2.35, -3.34);
    const frameMaterial = material(WOOD_DARK, 0.85);
    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(4.9, 2.62, 0.14), frameMaterial);
    boardFrame.castShadow = true;
    board.add(boardFrame);
    const slate = new THREE.Mesh(new THREE.BoxGeometry(4.55, 2.28, 0.1), material(CHALKBOARD, 0.98));
    slate.position.z = 0.04;
    board.add(slate);

    const chalkTexture = makeChalkTexture();
    const chalkSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 2.14),
      new THREE.MeshStandardMaterial({ map: chalkTexture, roughness: 0.96 }),
    );
    chalkSurface.position.set(0, 0.02, 0.1);
    board.add(chalkSurface);

    const tray = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.08, 0.24), material(WOOD_DARK, 0.85));
    tray.position.set(0, -1.34, 0.16);
    board.add(tray);
    const chalkColors = ['#f2f5ee', '#e8c98a', '#c96442', '#d9e7d2'];
    chalkColors.forEach((color, index) => {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.2, 8), material(color, 0.85));
      stick.rotation.z = Math.PI / 2;
      stick.position.set(-0.55 + index * 0.34, -1.27, 0.22);
      board.add(stick);
    });
    const eraser = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.16), material('#5b4a3a', 0.95));
    eraser.position.set(1.5, -1.27, 0.22);
    board.add(eraser);
    scene.add(board);

    // a quiet window with warm afternoon light
    const windowGroup = new THREE.Group();
    windowGroup.position.set(3.9, 2.55, -3.52);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 2.8),
      new THREE.MeshStandardMaterial({ color: '#fff1d2', emissive: '#ffe5b4', emissiveIntensity: 0.85, roughness: 1 }),
    );
    windowGroup.add(glow);
    const frame = material('#efe7d8', 0.8);
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.9, 0.1), frame);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.1), frame);
    barV.position.z = 0.05;
    barH.position.z = 0.05;
    windowGroup.add(barV, barH);
    scene.add(windowGroup);

    // desk
    const desk = new THREE.Group();
    desk.position.set(0.15, 0, 0.55);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.15, 1.5), material(WOOD, 0.78));
    top.position.y = 1.05;
    top.castShadow = true;
    top.receiveShadow = true;
    desk.add(top);
    const apron = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.46, 1.25), material(WOOD_DARK, 0.83));
    apron.position.y = 0.76;
    apron.castShadow = true;
    desk.add(apron);
    [[-1.65, 0.55], [1.65, 0.55], [-1.65, -0.55], [1.65, -0.55]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), material(WOOD_DARK, 0.85));
      leg.position.set(x, 0.5, z);
      leg.castShadow = true;
      desk.add(leg);
    });
    scene.add(desk);

    // notebook, pencil, mug and book stack
    const notebook = new THREE.Group();
    notebook.position.set(-0.55, 1.13, 0.42);
    notebook.rotation.y = 0.12;
    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.05, 1.0), material('#c96442', 0.8));
    cover.castShadow = true;
    notebook.add(cover);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.07, 0.94), material('#f5f0e6', 0.96));
    pages.position.y = 0.06;
    pages.castShadow = true;
    notebook.add(pages);
    const notebookTexture = makeNotebookTexture();
    const pageSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(1.24, 0.82),
      new THREE.MeshStandardMaterial({ map: notebookTexture, roughness: 0.95 }),
    );
    pageSurface.rotation.x = -Math.PI / 2;
    pageSurface.position.y = 0.1;
    notebook.add(pageSurface);
    scene.add(notebook);

    const pencil = new THREE.Group();
    pencil.position.set(1.05, 1.16, 0.92);
    pencil.rotation.set(0, 0.35, Math.PI / 2);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.92, 8), material('#e0b45c', 0.75));
    const nib = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 8), material('#e8d3b0', 0.8));
    nib.position.y = -0.52;
    pencil.add(body, nib);
    scene.add(pencil);

    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.34, 18), material('#d9e7d2', 0.65));
    mug.position.set(1.22, 1.31, 0.16);
    mug.castShadow = true;
    scene.add(mug);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.026, 8, 16), material('#d9e7d2', 0.65));
    handle.position.set(1.23, 1.33, 0.16);
    handle.rotation.y = Math.PI / 2;
    scene.add(handle);

    [0.22, 0.19, 0.16].forEach((factor, index) => {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.1, 0.66),
        material(index === 1 ? '#7f8f7a' : index === 2 ? '#c96442' : '#8a6a48', 0.85),
      );
      book.position.set(1.3, 1.2 + index * 0.1, -0.42);
      book.rotation.y = index * 0.16 - 0.1;
      book.castShadow = true;
      scene.add(book);
    });

    // dust in the window light
    const dustCount = 110;
    const positions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = 0.6 + Math.random() * 5;
      positions[i * 3 + 2] = -2.4 + Math.random() * 6;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMaterial = new THREE.PointsMaterial({ color: '#fff6e0', size: 0.022, transparent: true, opacity: 0.55, depthWrite: false });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    // framing and interaction
    const lookAt = new THREE.Vector3(0, 1.55, -1.0);
    const resetCamera = () => {
      camera.position.set(0, 2.25, 6.4);
      camera.lookAt(lookAt);
    };
    resetCamera();

    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (event) => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    };
    const onPointerLeave = () => { pointerX = 0; pointerY = 0; };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (reduceMotion) renderer.render(scene, camera);
    };

    let visible = true;
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
    }, { threshold: 0.05 });
    visibilityObserver.observe(host);

    let raf = 0;
    let last = performance.now();
    const animate = (now) => {
      raf = requestAnimationFrame(animate);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      targetX += (pointerX * 0.16 - targetX) * 0.06;
      targetY += (pointerY * 0.1 - targetY) * 0.06;
      camera.position.x = targetX * 6;
      camera.position.y = 2.25 - targetY * 2.4;
      camera.lookAt(lookAt);
      dust.rotation.y += delta * 0.012;
      dust.position.y = Math.sin(now * 0.00018) * 0.06;
      renderer.render(scene, camera);
    };

    resize();
    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerleave', onPointerLeave);
      raf = requestAnimationFrame(animate);
    }

    const onContextLost = (event) => {
      event.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => {
            if (item.map) item.map.dispose();
            item.dispose();
          });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={`scene-host ${className}`.trim()} ref={hostRef}>
      {failed && (
        <div className="scene-fallback" aria-hidden="true">
          <div className="scene-fallback__board" />
          <div className="scene-fallback__desk" />
        </div>
      )}
    </div>
  );
}
