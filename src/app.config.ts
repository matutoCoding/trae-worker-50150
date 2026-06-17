export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/orders/index',
    'pages/pricing/index',
    'pages/profile/index',
    'pages/booking/index',
    'pages/order-detail/index',
    'pages/monthly-booking/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '静学自习室',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F7FB',
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#4F6EF5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '选座',
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单',
      },
      {
        pagePath: 'pages/pricing/index',
        text: '价格',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
});
