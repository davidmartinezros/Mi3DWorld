import { Mi3DWorldPage } from './app.po';

describe('mi3-dworld App', function() {
  let page: Mi3DWorldPage;

  beforeEach(() => {
    page = new Mi3DWorldPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
