/**
 * swiper-block.js
 * Initializes Swiper for each .swiper-block element (block architecture).
 * Supports multiple block instances on the same page and Shopify Theme Editor events.
 */

(function () {
  /**
   * Per-instance registry keyed by block element ID.
   * Shared across all script tags (one per block on page).
   */
  var registry =
    window.__swiperBlockRegistry || (window.__swiperBlockRegistry = new Map());

  /**
   * Read a data attribute as boolean.
   * Liquid serializes booleans as the strings "true" / "false".
   * @param {string|undefined} val
   * @returns {boolean}
   */
  function asBool(val) {
    return val === "true";
  }

  /**
   * Initialize (or reinitialize) a single .swiper-block element.
   * All configuration is read from data-* attributes set in Liquid
   * so the JS never needs to know about block.settings directly.
   * @param {HTMLElement} blockEl
   */
  function initSwiper(blockEl) {
    var id = blockEl.id;
    if (!id) return;

    // Destroy previous Swiper instance for this block if one exists
    if (registry.has(id)) {
      var existing = registry.get(id);
      if (existing) existing.destroy(true, true);
      registry.delete(id);
    }

    var carousel = blockEl.querySelector(".swiper-block__carousel");
    if (!carousel) return;

    // ── Read settings from Liquid-generated data attributes ────────────────
    var slidesPerView = parseInt(blockEl.dataset.slidesPerView || "1", 10) || 1;
    var spaceBetween = parseInt(blockEl.dataset.spaceBetween || "16", 10) || 16;
    var loopEnabled = asBool(blockEl.dataset.loop);
    var autoplayOn = asBool(blockEl.dataset.autoplay);
    var autoplayDelay =
      parseInt(blockEl.dataset.autoplayDelay || "3000", 10) || 3000;
    var pauseOnHover = asBool(blockEl.dataset.pauseOnHover);
    var showPagination = asBool(blockEl.dataset.pagination);

    // Loop requires enough real slides to duplicate — guard against warnings
    var slideCount = carousel.querySelectorAll(".swiper-slide").length;
    var canLoop = loopEnabled && slideCount >= slidesPerView * 2;

    var config = {
      // ── Slides layout ─────────────────────────────────────────────────────
      // overridden at all breakpoints below; 1 is a safe fallback default
      slidesPerView: 1,
      spaceBetween: spaceBetween,

      // ── Loop ──────────────────────────────────────────────────────────────
      loop: canLoop,

      // Desktop drag support
      grabCursor: true,

      // ── Navigation ───────────────────────────────────────────────────────
      // Selectors scoped to this block's unique ID
      navigation: {
        prevEl: "#" + id + " .swiper-block__btn--prev",
        nextEl: "#" + id + " .swiper-block__btn--next",
      },

      // ── Pagination dots ───────────────────────────────────────────────────
      pagination: showPagination
        ? { el: "#" + id + " .swiper-pagination", clickable: true }
        : false,

      // ── Autoplay ──────────────────────────────────────────────────────────
      // pauseOnMouseEnter: Swiper v11 built-in; no manual listener required.
      // disableOnInteraction: false keeps autoplay alive after user swipes.
      autoplay: autoplayOn
        ? {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: pauseOnHover,
          }
        : false,

      // ── Responsive breakpoints ────────────────────────────────────────────
      // Mobile  (< 750px):  always 1 slide regardless of merchant setting
      // Tablet  (750–1023): cap at 2 so layout stays sensible
      // Desktop (≥ 1024px): use the merchant's slides-per-view setting
      breakpoints: {
        0: {
          slidesPerView: 1,
          spaceBetween: Math.min(spaceBetween, 12),
        },
        750: {
          slidesPerView: Math.min(slidesPerView, 2),
          spaceBetween: spaceBetween,
        },
        1024: {
          slidesPerView: slidesPerView,
          spaceBetween: spaceBetween,
        },
      },
    };

    // ── Initialize Swiper ─────────────────────────────────────────────────
    var swiper = new Swiper(carousel, config);
    registry.set(id, swiper);
  }

  /**
   * Initialize all .swiper-block elements found in the document.
   * Safe to call multiple times (existing instances are destroyed first).
   */
  function initAll() {
    document.querySelectorAll(".swiper-block").forEach(initSwiper);
  }

  // ── Shopify Theme Editor events ─────────────────────────────────────────
  // Guard prevents duplicate listener registration when multiple swiper
  // blocks exist on the same page (each injects the same script tag).
  if (!window.__swiperBlockListenersSet) {
    window.__swiperBlockListenersSet = true;

    // Section save / reload → reinit ALL swiper(s) inside that section
    document.addEventListener("shopify:section:load", function (e) {
      var target = /** @type {Element} */ (e.target);
      target.querySelectorAll(".swiper-block").forEach(function (el) {
        initSwiper(/** @type {HTMLElement} */ (el));
      });
    });

    // Slide block added, removed, selected, or deselected → reinit parent swiper.
    // Shopify fires these events on the SECTION element, so e.target is the section
    // root — not the swiper block. We try closest() first (handles standalone blocks
    // where the event fires on the block itself), then fall back to querySelector()
    // (handles blocks nested inside a section).
    ["shopify:block:select", "shopify:block:deselect"].forEach(
      function (evtName) {
        document.addEventListener(evtName, function (e) {
          var target = /** @type {Element} */ (e.target);
          var blockEl =
            target.closest(".swiper-block") ||
            target.querySelector(".swiper-block");
          if (blockEl) initSwiper(/** @type {HTMLElement} */ (blockEl));
        });
      },
    );
  }

  // ── Bootstrap on DOM ready ────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
