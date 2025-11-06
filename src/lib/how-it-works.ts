/**
 * How It Works Page - Consolidated JavaScript Module
 */

function isDocumentReady(): boolean {
  return document.readyState !== 'loading';
}

function onReady(callback: () => void): void {
  if (isDocumentReady()) {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}


export function initHorizontalCardReveal(): void {
  const cards = document.querySelectorAll('.work-step');
  
  if (cards.length === 0) return;
  
  const observerOptions = {
    root: null,
    rootMargin: '-10% 0px -20% 0px',
    threshold: [0, 0.1, 0.3, 0.5]
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const card = entry.target as HTMLElement;
      const cardIndex = parseInt(card.dataset.step || '1') - 1;
      const delay = cardIndex * 150;
      
      if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
        setTimeout(() => {
          card.classList.add('is-visible');
        }, delay);
      } else if (entry.boundingClientRect.top > window.innerHeight) {
        card.classList.remove('is-visible');
      }
    });
  }, observerOptions);
  
  cards.forEach((card) => {
    observer.observe(card);
  });
  
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
}

export function initRevealAnimations(): void {
  try {
    // Use the same reveal system as the first page for consistency
    if ((window as any).revealInstance) {
      return; // Already initialized
    }
    
    // Import and initialize reveal animations
    import('./reveal').then((module) => {
      if (typeof module.initReveal === 'function') {
        module.initReveal();
      }
    }).catch((error) => {
      // Fallback: try reveal-init as alternative
      if (typeof (window as any).initReveal === 'function') {
        (window as any).initReveal();
      } else {
        import('./reveal-init').then(() => {
          if (typeof (window as any).initReveal === 'function') {
            (window as any).initReveal();
          }
        }).catch(() => {
          // Silently fail - elements will remain visible
        });
      }
    });
  } catch (e) {
    // Silently fail - elements will remain visible
  }
}


export function initFAQ(): void {
  const faqSection = document.querySelector('.faq-section') || document.querySelector('.faq-list');
  if (!faqSection) return;
  
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length === 0) return;
  
  faqItems.forEach(item => {
    const answer = item.querySelector('.faq-answer') as HTMLElement;
    if (!answer) return;
    
    if (item.getAttribute('aria-expanded') !== 'true') {
      answer.style.maxHeight = '0px';
      answer.style.opacity = '0';
    }
    
    const resizeObserver = new ResizeObserver(() => {
      if (item.getAttribute('aria-expanded') === 'true') {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
    resizeObserver.observe(answer);
  });
  
  faqSection.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const question = target.closest('.faq-question') as HTMLElement;
    if (!question) return;
    
    e.preventDefault();
    const item = question.closest('.faq-item') as HTMLElement;
    if (!item) return;
    
    const answer = item.querySelector('.faq-answer') as HTMLElement;
    if (!answer) return;
    
    const isExpanded = item.getAttribute('aria-expanded') === 'true';
    
    faqItems.forEach(otherItem => {
      if (otherItem !== item) {
        const otherQuestion = otherItem.querySelector('.faq-question') as HTMLElement;
        const otherAnswer = otherItem.querySelector('.faq-answer') as HTMLElement;
        
        if (otherAnswer) {
          otherAnswer.style.maxHeight = '0px';
          otherAnswer.style.opacity = '0';
        }
        
        otherItem.setAttribute('aria-expanded', 'false');
        if (otherQuestion) {
          otherQuestion.setAttribute('aria-expanded', 'false');
        }
      }
    });
    
    if (isExpanded) {
      answer.style.maxHeight = '0px';
      answer.style.opacity = '0';
      item.setAttribute('aria-expanded', 'false');
      question.setAttribute('aria-expanded', 'false');
    } else {
      answer.style.maxHeight = answer.scrollHeight + 'px';
      answer.style.opacity = '1';
      item.setAttribute('aria-expanded', 'true');
      question.setAttribute('aria-expanded', 'true');
    }
  });
}


interface SwiperConfig {
  container: string;
  pagination?: string;
  prevBtn?: string;
  nextBtn?: string;
  autoplayDelay?: number;
}

function createSwiperConfig(config: SwiperConfig) {
  return {
    direction: 'horizontal' as const,
    loop: false,
    speed: 300,
    watchOverflow: true,
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true,
    cssMode: true,
    simulateTouch: false,
    allowTouchMove: true,
    passiveListeners: true,
    touchStartPreventDefault: false,
    touchReleaseOnEdges: true,
    freeMode: false,
    grabCursor: false,
    nested: false,
    resistance: true,
    resistanceRatio: 0.85,
    threshold: 10,
    longSwipes: false,
    longSwipesRatio: 0.5,
    longSwipesMs: 300,
    followFinger: true,
    touchRatio: 1,
    touchAngle: 45,
    touchEventsTarget: 'container',
    preventClicks: true,
    preventClicksPropagation: true,
    // Autoplay - disabled
    autoplay: false,
    pagination: config.pagination ? {
      el: config.pagination,
      clickable: true,
      dynamicBullets: false,
      type: 'bullets',
      renderBullet: function (index: number, className: string) {
        console.log('[PAGINATION DEBUG] Rendering bullet:', index, className);
        return '<span class="' + className + '"></span>';
      },
    } : undefined,
    navigation: false, // Отключена навигация, используем только пагинацию
    breakpoints: {
      320: { slidesPerView: 1, spaceBetween: 0, centeredSlides: true },
      768: { slidesPerView: 1, spaceBetween: 0, centeredSlides: true },
      1024: { slidesPerView: 1, spaceBetween: 0, centeredSlides: true },
    },
    on: {
      init: function(swiperInstance: any) {
        console.log('[PAGINATION DEBUG] Swiper init event fired');
        console.log('[PAGINATION DEBUG] Pagination element:', swiperInstance.pagination?.el);
        console.log('[PAGINATION DEBUG] Pagination bullets count:', swiperInstance.pagination?.bullets?.length || 0);
        console.log('[PAGINATION DEBUG] Pagination bullets:', swiperInstance.pagination?.bullets);
        
        // Проверяем DOM элемент пагинации
        const pagEl = document.querySelector(config.pagination || '') as HTMLElement;
        if (pagEl) {
          console.log('[PAGINATION DEBUG] Pagination DOM element found:', pagEl);
          console.log('[PAGINATION DEBUG] Pagination DOM innerHTML:', pagEl.innerHTML);
          console.log('[PAGINATION DEBUG] Pagination DOM children:', pagEl.children.length);
          console.log('[PAGINATION DEBUG] Pagination DOM children elements:', Array.from(pagEl.children).map(c => ({
            tag: c.tagName,
            classes: c.className,
            display: getComputedStyle(c).display,
            visibility: getComputedStyle(c).visibility,
            opacity: getComputedStyle(c).opacity,
          })));
          
          // Проверяем родительские элементы на overflow
          let parent = pagEl.parentElement;
          let parentLevel = 0;
          while (parent && parentLevel < 5) {
            const overflow = getComputedStyle(parent).overflow;
            const position = getComputedStyle(parent).position;
            if (overflow !== 'visible' || position !== 'static') {
              console.log(`[PAGINATION DEBUG] Parent level ${parentLevel}:`, {
                tag: parent.tagName,
                class: parent.className,
                overflow: overflow,
                position: position,
              });
            }
            parent = parent.parentElement;
            parentLevel++;
          }
          
          console.log('[PAGINATION DEBUG] Pagination computed styles:', {
            display: getComputedStyle(pagEl).display,
            visibility: getComputedStyle(pagEl).visibility,
            opacity: getComputedStyle(pagEl).opacity,
            zIndex: getComputedStyle(pagEl).zIndex,
            position: getComputedStyle(pagEl).position,
            bottom: getComputedStyle(pagEl).bottom,
            left: getComputedStyle(pagEl).left,
            width: getComputedStyle(pagEl).width,
            height: getComputedStyle(pagEl).height,
            overflow: getComputedStyle(pagEl).overflow,
          });
        } else {
          console.error('[PAGINATION DEBUG] Pagination DOM element NOT FOUND!');
          console.error('[PAGINATION DEBUG] Searching for selector:', config.pagination);
          console.error('[PAGINATION DEBUG] All pagination elements:', document.querySelectorAll('.swiper-pagination'));
        }
      },
      paginationRender: function(swiperInstance: any) {
        console.log('[PAGINATION DEBUG] paginationRender event fired');
        console.log('[PAGINATION DEBUG] Bullets after render:', swiperInstance.pagination?.bullets?.length || 0);
      },
    },
  };
}

function preloadNearbyImages(wrapper: HTMLElement, slides: NodeListOf<Element>): void {
  const currentScroll = wrapper.scrollLeft;
  const slideWidth = wrapper.clientWidth;
  const currentIndex = Math.round(currentScroll / slideWidth);
  
  const preloadIndices = [
    Math.max(0, currentIndex - 1),
    currentIndex,
    Math.min(slides.length - 1, currentIndex + 1)
  ];
  
  preloadIndices.forEach(index => {
    const slide = slides[index] as HTMLElement;
    if (!slide) return;
    
    const images = slide.querySelectorAll('img[loading="lazy"], img.lazy-image') as NodeListOf<HTMLImageElement>;
    images.forEach(img => {
      if (img.src && !img.complete && img.dataset.preloaded !== 'true') {
        img.dataset.preloaded = 'true';
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
      }
    });
  });
}

function setupSwiperNavigation(
  swiperContainer: HTMLElement,
  wrapper: HTMLElement,
  slides: NodeListOf<Element>,
  prevBtn: HTMLElement | null,
  nextBtn: HTMLElement | null
): void {
  if (!wrapper || !slides.length) return;
  
  function getNavButtons() {
    return {
      prevBtn: prevBtn || swiperContainer.querySelector('.swiper-button-prev') as HTMLElement,
      nextBtn: nextBtn || swiperContainer.querySelector('.swiper-button-next') as HTMLElement
    };
  }
  
  function updateNavButtons(): void {
    const { prevBtn, nextBtn } = getNavButtons();
    const scrollLeft = wrapper.scrollLeft;
    const scrollWidth = wrapper.scrollWidth;
    const clientWidth = wrapper.clientWidth;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    
    if (prevBtn) {
      if (scrollLeft <= 10) {
        prevBtn.classList.add('swiper-button-disabled');
        prevBtn.setAttribute('aria-disabled', 'true');
      } else {
        prevBtn.classList.remove('swiper-button-disabled');
        prevBtn.setAttribute('aria-disabled', 'false');
      }
    }
    
    if (nextBtn) {
      if (scrollLeft >= maxScroll - 10) {
        nextBtn.classList.add('swiper-button-disabled');
        nextBtn.setAttribute('aria-disabled', 'true');
      } else {
        nextBtn.classList.remove('swiper-button-disabled');
        nextBtn.setAttribute('aria-disabled', 'false');
      }
    }
  }
  
  function scrollToSlide(direction: 'prev' | 'next'): void {
    const currentScroll = wrapper.scrollLeft;
    const slideWidth = wrapper.clientWidth;
    const scrollWidth = wrapper.scrollWidth;
    const maxScroll = Math.max(0, scrollWidth - slideWidth);
    
    let targetScroll: number;
    
    if (direction === 'prev') {
      const currentSlide = Math.round(currentScroll / slideWidth);
      targetScroll = Math.max(0, (currentSlide - 1) * slideWidth);
    } else {
      const currentSlide = Math.round(currentScroll / slideWidth);
      targetScroll = Math.min(maxScroll, (currentSlide + 1) * slideWidth);
    }
    
    if (targetScroll === currentScroll) return;
    
    requestAnimationFrame(() => {
      try {
        wrapper.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      } catch (e) {
        wrapper.scrollLeft = targetScroll;
      }
    });
  }
  
  function attachButtonHandlers(button: HTMLElement, direction: 'prev' | 'next'): void {
    const handleClick = (e: Event) => {
      if (button.classList.contains('swiper-button-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      scrollToSlide(direction);
      return false;
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (button.classList.contains('swiper-button-disabled')) {
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (button.classList.contains('swiper-button-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      scrollToSlide(direction);
    };
    
    button.addEventListener('click', handleClick, { capture: true, passive: false });
    button.addEventListener('touchend', handleTouchEnd, { capture: true, passive: false });
    button.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    
    if ('ontouchstart' in window === false) {
      button.addEventListener('mousedown', (e) => {
        if (button.classList.contains('swiper-button-disabled')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
      }, { capture: true });
    }
  }
  
  const navButtons = getNavButtons();
  
  if (navButtons.prevBtn) {
    attachButtonHandlers(navButtons.prevBtn, 'prev');
  }
  
  if (navButtons.nextBtn) {
    attachButtonHandlers(navButtons.nextBtn, 'next');
  }
  
  // Optimized scroll handler with throttling
  let scrollTimeout: ReturnType<typeof setTimeout>;
  let rafId: number | null = null;
  
  const handleScroll = () => {
    // Cancel pending RAF
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    
    // Clear existing timeout
    clearTimeout(scrollTimeout);
    
    // Throttle updates to every 16ms (60fps) using RAF
    rafId = requestAnimationFrame(() => {
      updateNavButtons();
      preloadNearbyImages(wrapper, slides);
      rafId = null;
    });
    
    // Also debounce for less frequent updates
    scrollTimeout = setTimeout(() => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updateNavButtons();
          preloadNearbyImages(wrapper, slides);
          rafId = null;
        });
      }
    }, 100);
  };
  
  wrapper.addEventListener('scroll', handleScroll, { passive: true });
  
  if ('onscrollend' in wrapper) {
    wrapper.addEventListener('scrollend', () => {
      requestAnimationFrame(() => {
        updateNavButtons();
        preloadNearbyImages(wrapper, slides);
      });
    }, { passive: true });
  }
  
  setTimeout(() => {
    requestAnimationFrame(() => {
      updateNavButtons();
      preloadNearbyImages(wrapper, slides);
    });
  }, 100);
  
  let resizeTimeout: ReturnType<typeof setTimeout>;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        updateNavButtons();
      });
    }, 150);
  });
  
  resizeObserver.observe(wrapper);
  resizeObserver.observe(swiperContainer);
}

function loadSwiperLibrary(callback: () => void): void {
  if (typeof (window as any).Swiper !== 'undefined') {
    callback();
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
  script.async = true; // Load asynchronously
  script.onload = callback;
  script.onerror = function() {
    console.error('[Swiper] Failed to load Swiper library');
  };
  document.head.appendChild(script);
}


export function initTestimonialsSwiper(): void {
  loadSwiperLibrary(() => {
    createTestimonialsSwiper();
  });
}

function createTestimonialsSwiper(): void {
  console.log('[PAGINATION DEBUG] Starting createTestimonialsSwiper...');
  
  const swiperContainer = document.querySelector('.testimonials-swiper') as HTMLElement;
  if (!swiperContainer) {
    console.error('[PAGINATION DEBUG] Swiper container not found!');
    return;
  }
  console.log('[PAGINATION DEBUG] Swiper container found:', swiperContainer);
  
  const Swiper = (window as any).Swiper;
  if (!Swiper) {
    console.error('[PAGINATION DEBUG] Swiper library not loaded!');
    return;
  }
  console.log('[PAGINATION DEBUG] Swiper library loaded');
  
  // Проверяем элемент пагинации ДО создания Swiper
  const paginationSelector = '.testimonial-pagination';
  const paginationEl = document.querySelector(paginationSelector) as HTMLElement;
  console.log('[PAGINATION DEBUG] Pagination element:', paginationEl);
  console.log('[PAGINATION DEBUG] Pagination element styles:', {
    display: paginationEl?.style.display || getComputedStyle(paginationEl || document.body).display,
    visibility: paginationEl?.style.visibility || getComputedStyle(paginationEl || document.body).visibility,
    opacity: paginationEl?.style.opacity || getComputedStyle(paginationEl || document.body).opacity,
    zIndex: paginationEl?.style.zIndex || getComputedStyle(paginationEl || document.body).zIndex,
    position: paginationEl?.style.position || getComputedStyle(paginationEl || document.body).position,
  });
  
  const swiper = new Swiper('.testimonials-swiper', createSwiperConfig({
    container: '.testimonials-swiper',
    pagination: '.testimonial-pagination',
    autoplayDelay: 5000
  }));
  
  console.log('[PAGINATION DEBUG] Swiper created:', swiper);
  console.log('[PAGINATION DEBUG] Swiper pagination:', swiper.pagination);
  console.log('[PAGINATION DEBUG] Swiper pagination bullets:', swiper.pagination?.bullets?.length || 0);
  
  const wrapper = swiperContainer.querySelector('.swiper-wrapper') as HTMLElement;
  const slides = wrapper?.querySelectorAll('.swiper-slide');
  
  if (wrapper && slides) {
    setupSwiperNavigation(swiperContainer, wrapper, slides, null, null);
  }
  
  let touchStartY = 0;
  wrapper.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    if (window.scrollY === 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, 1);
      });
    }
  }, { passive: true });
  
  wrapper.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const deltaY = Math.abs(touchY - touchStartY);
    if (deltaY > 10) {
      e.stopPropagation();
    }
  }, { passive: true });
}


export function initStudentModelsSwiper(): void {
  loadSwiperLibrary(() => {
    createStudentModelsSwiper();
  });
}

function createStudentModelsSwiper(): void {
  console.log('[PAGINATION DEBUG] Starting createStudentModelsSwiper...');
  
  const swiperContainer = document.querySelector('.student-models-swiper') as HTMLElement;
  if (!swiperContainer) {
    console.error('[PAGINATION DEBUG] Swiper container not found!');
    return;
  }
  console.log('[PAGINATION DEBUG] Swiper container found:', swiperContainer);
  
  const Swiper = (window as any).Swiper;
  if (!Swiper) {
    console.error('[PAGINATION DEBUG] Swiper library not loaded!');
    return;
  }
  console.log('[PAGINATION DEBUG] Swiper library loaded');
  
  // Проверяем элемент пагинации ДО создания Swiper
  const paginationSelector = '.model-pagination';
  const paginationEl = document.querySelector(paginationSelector) as HTMLElement;
  console.log('[PAGINATION DEBUG] Pagination element:', paginationEl);
  console.log('[PAGINATION DEBUG] Pagination element styles:', {
    display: paginationEl?.style.display || getComputedStyle(paginationEl || document.body).display,
    visibility: paginationEl?.style.visibility || getComputedStyle(paginationEl || document.body).visibility,
    opacity: paginationEl?.style.opacity || getComputedStyle(paginationEl || document.body).opacity,
    zIndex: paginationEl?.style.zIndex || getComputedStyle(paginationEl || document.body).zIndex,
    position: paginationEl?.style.position || getComputedStyle(paginationEl || document.body).position,
  });
  
  const swiper = new Swiper('.student-models-swiper', createSwiperConfig({
    container: '.student-models-swiper',
    pagination: '.model-pagination',
    autoplayDelay: 4000
  }));
  
  console.log('[PAGINATION DEBUG] Swiper created:', swiper);
  console.log('[PAGINATION DEBUG] Swiper pagination:', swiper.pagination);
  console.log('[PAGINATION DEBUG] Swiper pagination bullets:', swiper.pagination?.bullets?.length || 0);
  
  const wrapper = swiperContainer.querySelector('.swiper-wrapper') as HTMLElement;
  const slides = wrapper?.querySelectorAll('.swiper-slide');
  
  if (wrapper && slides) {
    setupSwiperNavigation(swiperContainer, wrapper, slides, null, null);
  }
  
  swiperContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.swiper-button-prev, .swiper-button-next');
    if (button) return;
    
    const imageWrapper = target.closest('.model-image-wrapper');
    if (!imageWrapper) return;
    
    const img = imageWrapper.querySelector('.model-photo') as HTMLImageElement;
    if (img?.src) {
      const modal = document.getElementById('photoModal');
      if (modal) {
        const modalImg = modal.querySelector('.modal-image') as HTMLImageElement;
        if (modalImg) {
          modalImg.src = img.src;
          modalImg.alt = img.alt || 'Модель ученика';
          (modal as HTMLElement).style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }
    }
  });
  
  let touchStartY = 0;
  wrapper.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    if (window.scrollY === 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, 1);
      });
    }
  }, { passive: true });
  
  wrapper.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const deltaY = Math.abs(touchY - touchStartY);
    if (deltaY > 10) {
      e.stopPropagation();
    }
  }, { passive: true });
}


export function initTelegramWebAppFixes(): void {
  function ensureDocumentIsScrollable(): void {
    const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
    if (!isScrollable) {
      document.documentElement.style.setProperty('height', 'calc(100vh + 1px)', 'important');
    }
  }
  
  function preventTelegramCollapse(): void {
    if (window.scrollY === 0) {
      window.scrollTo(0, 1);
    }
  }
  
  ensureDocumentIsScrollable();
  window.addEventListener('resize', ensureDocumentIsScrollable);
  
  if ((window as any).Telegram?.WebApp) {
    try {
      (window as any).Telegram.WebApp.disableVerticalSwipes();
      (window as any).Telegram.WebApp.expand();
    } catch (e) {}
    
    document.addEventListener('touchstart', preventTelegramCollapse, { passive: true });
  }
}


export function preventOrphans(): void {
  const prepositions = ['в', 'на', 'с', 'по', 'о', 'у', 'за', 'из', 'к', 'до', 'от', 'об', 'под', 'про', 'для', 'без', 'над', 'при', 'через', 'между', 'среди'];
  const shortWords = ['и', 'а', 'но', 'или', 'как', 'что', 'где', 'чем', 'оно', 'они', 'она', 'он', 'ты', 'мы', 'вы'];
  const wordsToPrevent = [...prepositions, ...shortWords];
  
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li, .comparison-text, .step-list li, .tariff-list li, .path-description, .tariff-description, .tariff-note');
  
  elements.forEach(element => {
    if (element.innerHTML.includes('<strong>') || element.innerHTML.includes('<span') || element.innerHTML.includes('<em>') || element.innerHTML.includes('<a>')) {
      return;
    }
    
    const htmlElement = element as HTMLElement;
    let text = element.textContent || htmlElement.innerText;
    if (!text || text.trim().length < 10) return;
    
    wordsToPrevent.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b `, 'gi');
      text = text.replace(regex, `${word}\u00A0`);
    });
    
    if (text !== (element.textContent || htmlElement.innerText)) {
      element.textContent = text;
    }
  });
}


export function initLazyLoading(): void {
  // Use same approach as first page - handle all lazy images
  const lazyImages = document.querySelectorAll('img[loading="lazy"], img.lazy-image');
  
  if (!lazyImages.length) return;
  
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback: show all images immediately
    lazyImages.forEach(img => {
      (img as HTMLImageElement).classList.add('loaded');
    });
    return;
  }
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        
        // If image is already loaded, show it immediately
        if (img.complete && img.naturalHeight !== 0) {
          img.classList.add('loaded');
          observer.unobserve(img);
        } else {
          // Add loading state
          img.classList.add('loading');
          
          // Wait for image to load
          const handleLoad = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            observer.unobserve(img);
          };
          
          const handleError = () => {
            // Handle error - still show image to prevent white space
            img.classList.remove('loading');
            img.classList.add('loaded');
            observer.unobserve(img);
          };
          
          img.addEventListener('load', handleLoad, { once: true });
          img.addEventListener('error', handleError, { once: true });
        }
      }
    });
  }, {
    root: null,
    rootMargin: '50px', // Start loading images 50px before they enter viewport
    threshold: 0.01
  });
  
  // Check initial viewport and observe remaining images
  lazyImages.forEach(img => {
    const imageElement = img as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    
    if (isInViewport && imageElement.complete && imageElement.naturalHeight !== 0) {
      // Already loaded and in viewport - show immediately
      imageElement.classList.add('loaded');
    } else {
      // Observe for lazy loading
      imageObserver.observe(img);
    }
  });
}


export function initPhotoModal(): void {
  const modal = document.getElementById('photoModal') as HTMLElement;
  if (!modal) return;
  
  const modalImg = modal.querySelector('.modal-image') as HTMLImageElement;
  const closeBtn = modal.querySelector('.modal-close') as HTMLElement;
  
  let isModalOpen = false;
  
  function openModal(imgSrc: string, imgAlt: string): void {
    if (modalImg && !isModalOpen) {
      modalImg.src = imgSrc;
      modalImg.alt = imgAlt;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      isModalOpen = true;
    }
  }
  
  function closeModal(): void {
    if (!isModalOpen) return;
    
    modal.style.display = 'none';
    if (modalImg) modalImg.src = '';
    document.body.style.overflow = '';
    isModalOpen = false;
  }
  
  if (closeBtn) {
    const handleCloseClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closeModal();
      return false;
    };
    
    closeBtn.addEventListener('click', handleCloseClick, { capture: true, passive: false });
    closeBtn.addEventListener('touchend', handleCloseClick, { capture: true, passive: false });
    
    if ('ontouchstart' in window === false) {
      closeBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      }, { capture: true });
    }
  }
  
  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === modal && isModalOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  }, { passive: false });
  
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    const sliderContainer = target.closest('.slider-image-container');
    if (sliderContainer) {
      const img = sliderContainer.querySelector('.slider-photo') as HTMLImageElement;
      if (img?.src && !isModalOpen) {
        e.preventDefault();
        e.stopPropagation();
        openModal(img.src, img.alt || 'Фото отзыва');
        return;
      }
    }
    
    const testimonialContainer = target.closest('.testimonial-image-container');
    if (testimonialContainer) {
      const img = testimonialContainer.querySelector('.testimonial-photo') as HTMLImageElement;
      if (img?.src && !isModalOpen) {
        e.preventDefault();
        e.stopPropagation();
        openModal(img.src, img.alt || 'Фото отзыва');
        return;
      }
    }
    
    const modelWrapper = target.closest('.model-image-wrapper');
    if (modelWrapper) {
      const img = modelWrapper.querySelector('.model-photo') as HTMLImageElement;
      if (img?.src && !isModalOpen) {
        e.preventDefault();
        e.stopPropagation();
        openModal(img.src, img.alt || 'Модель ученика');
        return;
      }
    }
  }, { passive: false });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
  }, { passive: false });
  
  (window as any).closePhotoModal = closeModal;
  (window as any).isPhotoModalOpen = () => isModalOpen;
}


function scrollToElement(targetId: string): void {
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;
  
  const mainContentEl = document.getElementById('main-content') || document.querySelector('main');
  const targetRect = targetElement.getBoundingClientRect();
  const viewportHeight = mainContentEl ? (mainContentEl as HTMLElement).clientHeight : window.innerHeight;
  const offset = viewportHeight * 0.2;
  
  let scrollTop: number;
  
  if (mainContentEl) {
    scrollTop = (mainContentEl as HTMLElement).scrollTop + targetRect.top - offset;
    const maxScroll = (mainContentEl as HTMLElement).scrollHeight - (mainContentEl as HTMLElement).clientHeight;
    scrollTop = Math.min(scrollTop, maxScroll);
    scrollTop = Math.max(0, scrollTop);
    
    (mainContentEl as HTMLElement).scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  } else {
    scrollTop = window.pageYOffset + targetRect.top - offset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollTop = Math.min(scrollTop, maxScroll);
    scrollTop = Math.max(0, scrollTop);
    
    window.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }
}

export function initSmoothScroll(): void {
  const mainContentEl = document.getElementById('main-content') || document.querySelector('main');
  
  // Handle hash on page load
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    if (hash) {
      // Wait for page to fully load before scrolling
      setTimeout(() => {
        scrollToElement(hash);
      }, 300);
    }
  }
  
  // Handle hash changes
  window.addEventListener('hashchange', () => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setTimeout(() => {
          scrollToElement(hash);
        }, 100);
      }
    }
  });
  
  // Handle click on anchor links
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[data-scroll-to], a[href^="#"]') as HTMLAnchorElement;
    if (!link) return;
    
    const href = link.getAttribute('href');
    const scrollTo = link.getAttribute('data-scroll-to');
    
    // Handle external links with hash (e.g., /how-it-works#pricing)
    if (href && href.includes('#') && !href.startsWith('#')) {
      const parts = href.split('#');
      if (parts.length === 2 && parts[0] === '/how-it-works') {
        // This will be handled by navigation
        return;
      }
    }
    
    if (!href || !href.startsWith('#')) return;
    
    const targetId = scrollTo || href.substring(1);
    if (!targetId) return;
    
    e.preventDefault();
    scrollToElement(targetId);
  });
}


// Tariff data configuration
interface TariffData {
  name: string;
  rub: {
    amount: string;
    url: string;
  };
  eur: {
    amount: string;
    url: string;
  };
}

const TARIFFS: Record<string, TariffData> = {
  '1': {
    name: 'Самостоятельный',
    rub: {
      amount: '24.000 ₽',
      url: 'https://t.me/tribute/app?startapp=sFjs'
    },
    eur: {
      amount: '250 €',
      url: 'https://t.me/tribute/app?startapp=sFjp'
    }
  },
  '2': {
    name: 'Все и сразу',
    rub: {
      amount: '56.500 ₽',
      url: 'https://t.me/tribute/app?startapp=sFjo'
    },
    eur: {
      amount: '600 €',
      url: 'https://t.me/tribute/app?startapp=sFjk'
    }
  }
};

export function initCurrencyModal(): void {
  const modal = document.getElementById('currencyModal') as HTMLElement;
  if (!modal) return;
  
  const backdrop = modal.querySelector('.currency-modal-backdrop') as HTMLElement;
  const closeBtn = modal.querySelector('.currency-modal-close') as HTMLElement;
  const rubBtn = modal.querySelector('.currency-btn-rub') as HTMLAnchorElement;
  const eurBtn = modal.querySelector('.currency-btn-eur') as HTMLAnchorElement;
  const rubAmount = modal.querySelector('#currencyRubAmount') as HTMLElement;
  const eurAmount = modal.querySelector('#currencyEurAmount') as HTMLElement;
  const supportBtn = modal.querySelector('#currencySupportLink') as HTMLAnchorElement;
  
  let isModalOpen = false;
  let currentTariff: string | null = null;
  
  // Support link for tariffs 1 and 2
  const supportLink = 'https://t.me/illariooo';
  
  function openModal(tariffId: string): void {
    if (isModalOpen || !TARIFFS[tariffId]) return;
    
    currentTariff = tariffId;
    const tariff = TARIFFS[tariffId];
    
    // Update amounts
    if (rubAmount) rubAmount.textContent = tariff.rub.amount;
    if (eurAmount) eurAmount.textContent = tariff.eur.amount;
    
    // Update links
    if (rubBtn) rubBtn.href = tariff.rub.url;
    if (eurBtn) eurBtn.href = tariff.eur.url;
    
    // Update support link for tariffs 1 and 2
    if (supportBtn && (tariffId === '1' || tariffId === '2')) {
      supportBtn.href = supportLink;
    }
    
    // Show modal with animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Trigger animation
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      backdrop?.classList.add('is-active');
    });
    
    isModalOpen = true;
    
    // Haptic feedback
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  }
  
  function closeModal(): void {
    if (!isModalOpen) return;
    
    // Remove animation classes
    modal.classList.remove('is-open');
    backdrop?.classList.remove('is-active');
    
    // Hide after animation
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      isModalOpen = false;
      currentTariff = null;
    }, 200);
    
    // Haptic feedback
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  }
  
  // Close button handler
  if (closeBtn) {
    const handleClose = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };
    
    closeBtn.addEventListener('click', handleClose, { passive: false });
    closeBtn.addEventListener('touchend', handleClose, { passive: false });
  }
  
  // Backdrop click handler
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        e.preventDefault();
        closeModal();
      }
    }, { passive: false });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) {
      e.preventDefault();
      closeModal();
    }
  }, { passive: false });
  
  // Handle tariff button clicks
  const tariffButtons = document.querySelectorAll('[data-tariff]');
  tariffButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tariffId = (btn as HTMLElement).dataset.tariff;
      if (tariffId) {
        openModal(tariffId);
      }
    }, { passive: false });
  });
  
  // Currency button click handlers (for analytics)
  if (rubBtn) {
    rubBtn.addEventListener('click', () => {
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    });
  }
  
  if (eurBtn) {
    eurBtn.addEventListener('click', () => {
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
    });
  }
  
  // Expose functions globally for Telegram WebApp BackButton
  (window as any).closeCurrencyModal = closeModal;
  (window as any).isCurrencyModalOpen = () => isModalOpen;
}


export function initHowItWorks(): void {
  onReady(() => {
    initRevealAnimations();
    initHorizontalCardReveal();
    initFAQ();
    initTestimonialsSwiper();
    initStudentModelsSwiper();
    initTelegramWebAppFixes();
    preventOrphans();
    initLazyLoading();
    initPhotoModal();
    initCurrencyModal();
    initSmoothScroll();
    
    // Handle hash after page fully loads (for navigation from other pages)
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (hash === 'pricing') {
        // Wait for all content to render
        setTimeout(() => {
          const targetElement = document.getElementById('pricing');
          if (targetElement) {
            const mainContentEl = document.getElementById('main-content') || document.querySelector('main');
            const targetRect = targetElement.getBoundingClientRect();
            const viewportHeight = mainContentEl ? (mainContentEl as HTMLElement).clientHeight : window.innerHeight;
            const offset = viewportHeight * 0.15;
            
            let scrollTop: number;
            
            if (mainContentEl) {
              scrollTop = (mainContentEl as HTMLElement).scrollTop + targetRect.top - offset;
              const maxScroll = (mainContentEl as HTMLElement).scrollHeight - (mainContentEl as HTMLElement).clientHeight;
              scrollTop = Math.min(scrollTop, maxScroll);
              scrollTop = Math.max(0, scrollTop);
              
              (mainContentEl as HTMLElement).scrollTo({
                top: scrollTop,
                behavior: 'smooth'
              });
            } else {
              scrollTop = window.pageYOffset + targetRect.top - offset;
              const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
              scrollTop = Math.min(scrollTop, maxScroll);
              scrollTop = Math.max(0, scrollTop);
              
              window.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
              });
            }
          }
        }, 500);
      }
    }
  });
}

