const siteHeader = () => ({
  isOpenHamburger: false,
  selected: 0,

  toggleHamburger() {
    this.isOpenHamburger = !this.isOpenHamburger;
  },

  selectTab(index: number) {
    this.selected = this.selected !== index ? index : 0;
  },
});

export default siteHeader;
