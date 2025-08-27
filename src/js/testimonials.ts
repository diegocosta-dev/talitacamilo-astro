type TestimonialsSlider = {
  slidesLength: number;
  autoplayIntervalTime: number;
  isPaused: boolean;
  autoplayInterval: ReturnType<typeof setInterval> | null;
  currentSlideIndex: number;
  previous: () => void;
  next: () => void;
  autoplay: () => void;
  setAutoplayInterval: (newIntervalTime: number) => void;
};

const testimonials = (slidesLength: number): TestimonialsSlider => ({
  currentSlideIndex: 1,
  isPaused: false,
  autoplayInterval: null,
  autoplayIntervalTime: 4000,
  slidesLength: slidesLength,

  previous() {
    if (this.currentSlideIndex > 1) {
      this.currentSlideIndex -= 1;
    } else {
      this.currentSlideIndex = this.slidesLength;
    }
  },

  next() {
    if (this.currentSlideIndex < this.slidesLength) {
      this.currentSlideIndex += 1;
    } else {
      this.currentSlideIndex = 1;
    }
  },

  autoplay() {
    this.autoplayInterval = setInterval(() => {
      if (!this.isPaused) {
        this.next();
      }
    }, this.autoplayIntervalTime);
  },

  setAutoplayInterval(newIntervalTime: number) {
    if (this.autoplayInterval !== null) {
      clearInterval(this.autoplayInterval);
    }
    this.autoplayIntervalTime = newIntervalTime;
    this.autoplay();
  },
});

export default testimonials;
