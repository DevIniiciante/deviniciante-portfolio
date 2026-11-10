"use strict";

const header = document.querySelector(".header");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector("#navigation");
const mobile = matchMedia("(max-width: 680px)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  navigation.hidden = mobile.matches && !open;
}

header.classList.add("menu-enhanced");
function syncMenu() {
  const focusedMenu = navigation.contains(document.activeElement);
  menuButton.hidden = !mobile.matches;
  setMenu(false);
  if (mobile.matches && focusedMenu) menuButton.focus();
}
syncMenu();
mobile.addEventListener("change", syncMenu);
menuButton.addEventListener("click", () => setMenu(navigation.hidden));
navigation.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || !mobile.matches) return;

  setMenu(false);
  const target = document.getElementById(link.hash.slice(1));
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener("pointerdown", (event) => {
  if (!header.contains(event.target) && !navigation.hidden && mobile.matches) {
    if (navigation.contains(document.activeElement)) menuButton.focus();
    setMenu(false);
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();
const projectLinks = document.querySelectorAll(".project-index a");
function markProject() {
  for (const link of projectLinks) {
    if (link.hash === location.hash) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}
window.addEventListener("hashchange", markProject);
markProject();

const lab = document.querySelector("#lab-stage");
const labToggle = document.querySelector("#lab-toggle");
const labNote = document.querySelector("#lab-note");

labToggle.hidden = false;
labToggle.addEventListener("click", () => {
  const expanded = labToggle.getAttribute("aria-pressed") === "false";
  lab.dataset.view = expanded ? "camadas" : "montado";
  labToggle.setAttribute("aria-pressed", String(expanded));
  labNote.textContent = expanded
    ? "Camadas separadas: estrutura, design e interface final."
    : "Uma interface feita de estrutura, design e interação.";
});

const motionToggle = document.querySelector("#motion-toggle");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
let manualReduction = false;
let stopEffects = () => {};

try {
  manualReduction = localStorage.getItem("deviniciante-motion") === "reduced";
} catch {
  // The button still controls motion for this visit when storage is unavailable.
}
function syncMotion() {
  const reduce = motionPreference.matches || manualReduction;
  root.dataset.motion = reduce ? "reduced" : "full";
  motionToggle.hidden = motionPreference.matches;
  motionToggle.setAttribute("aria-pressed", String(reduce));
  stopEffects();
  stopEffects = reduce ? () => {} : activateEffects();
}

motionToggle.addEventListener("click", () => {
  manualReduction = !manualReduction;
  try {
    localStorage.setItem("deviniciante-motion", manualReduction ? "reduced" : "full");
  } catch {
    // The current page still honors the selection.
  }
  syncMotion();
});
motionPreference.addEventListener("change", syncMotion);
syncMotion();

function activateEffects() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return () => {};

  gsap.registerPlugin(ScrollTrigger);
  const events = new AbortController();
  const { signal } = events;
  const revealTweens = new Set();
  const context = gsap.context(() => {
    if (scrollY < 64 && !location.hash) {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-mask .hero-enter", { yPercent: 102, duration: .64, stagger: .08, clearProps: "transform" })
        .from(".hero-copy > .hero-enter, .actions.hero-enter", { y: 16, opacity: .35, duration: .5, stagger: .07, clearProps: "transform,opacity" }, 0)
        .from(".hero-art", { scale: .93, opacity: .45, duration: .8, clearProps: "transform,opacity" }, 0);
    }

    for (const element of document.querySelectorAll("[data-reveal]")) {
      ScrollTrigger.create({
        trigger: element,
        start: "top 94%",
        once: true,
        onEnter: () => {
          if (element.contains(document.activeElement)) return;
          const isMedia = element.classList.contains("case-media");
          const reveal = gsap.fromTo(element, {
            opacity: .35,
            y: isMedia ? 0 : 22,
            clipPath: isMedia ? "inset(7% 4% 7% 4% round 1rem)" : "none",
          }, {
            opacity: 1,
            y: 0,
            clipPath: "inset(0% 0% 0% 0% round 0rem)",
            duration: isMedia ? .85 : .54,
            ease: "power2.out",
            clearProps: "opacity,clipPath,transform",
            onComplete: () => revealTweens.delete(reveal),
          });
          revealTweens.add(reveal);
        },
      });
    }

    gsap.to(".scroll-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    gsap.fromTo(".steps", { "--draw": 0 }, { "--draw": 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 86%", end: "bottom 68%", scrub: true } });
    gsap.to(".lab-backdrop", { y: 32, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .35 } });

    if (finePointer.matches) {
      const hero = document.querySelector(".hero");
      trackPointer(hero, hero.querySelector(".lab-scene"), "translate", 23, signal);
      for (const card of document.querySelectorAll("[data-tilt]")) {
        trackPointer(card, card, "tilt", 5, signal);
      }
      for (const magnet of document.querySelectorAll("[data-magnetic]")) {
        trackPointer(magnet, magnet, "translate", 7, signal);
      }
    }

    gsap.fromTo(".founder-story", { "--story-progress": 0 }, {
      "--story-progress": 1,
      ease: "none",
      scrollTrigger: { trigger: ".founder", start: "top 88%", end: "center center", scrub: .5 },
    });

    for (const details of document.querySelectorAll("details")) {
      details.addEventListener("toggle", () => {
        ScrollTrigger.refresh();
        if (details.open) {
          gsap.fromTo(details.querySelector("p"), { y: -5, opacity: .45 }, {
            y: 0, opacity: 1, duration: .25, overwrite: "auto", clearProps: "transform,opacity",
          });
        }
      }, { signal });
    }
  });

  return () => {
    events.abort();
    for (const tween of revealTweens) tween.revert();
    gsap.killTweensOf("details p");
    gsap.set("details p", { clearProps: "transform,opacity" });
    context.revert();
    for (const target of document.querySelectorAll("[data-tilt], [data-magnetic], .lab-scene")) {
      target.style.removeProperty("transform");
      target.style.removeProperty("translate");
    }
  };
}

function trackPointer(area, target, effect, strength, signal) {
  let frame = 0;
  let bounds;

  area.addEventListener("pointerenter", () => {
    bounds = area.getBoundingClientRect();
  }, { signal });
  area.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    if (!bounds) bounds = area.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * strength;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * strength;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (effect === "tilt") target.style.transform = `perspective(850px) rotateX(${-y}deg) rotateY(${x}deg)`;
      else target.style.translate = `${x}px ${y}px`;
    });
  }, { signal });

  const reset = () => {
    cancelAnimationFrame(frame);
    target.style.removeProperty("transform");
    target.style.removeProperty("translate");
    bounds = undefined;
  };
  area.addEventListener("pointerleave", reset, { signal });
  signal.addEventListener("abort", reset, { once: true });
}
