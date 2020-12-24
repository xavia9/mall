<template>
  <div id="home" class="wrapper">
    <nav-bar class="home-nav"><div slot="center">购物街</div></nav-bar>
    <tab-control
      :titles="['流行', '新款', '精选']"
      @tabClick="tabClick"
      ref="tabControl1"
      class="tab-control1"
      v-show="isTabFixed"
    />
    <scroll
      class="content"
      ref="scroll"
      :probe-type="2"
      @scroll="contentScroll"
      :pull-up-load="true"
      @pullingUp="loadMore"
    >
      <home-swiper :banners="banners" @swiperImageLoad="swiperImageLoad" />
      <recommend-view :recommends="recommends" />
      <feature-view />
      <tab-control
        :titles="['流行', '新款', '精选']"
        @tabClick="tabClick"
        ref="tabControl2"
      />
      <good-list :goods="showGoods" />
    </scroll>
    <back-top @click.native="backClick" v-show="isShowBackTop" />
  </div>
</template>

<script>
import HomeSwiper from "./childComps/HomeSwiper";
import RecommendView from "./childComps/RecommendView";
import FeatureView from "./childComps/FeatureView";

import NavBar from "components/common/navbar/NavBar";
import TabControl from "components/content/tabControl/TabControl";
import GoodList from "components/content/goods/GoodsList";
import Scroll from "components/common/scroll/Scroll";
import BackTop from "components/content/backTop/BackTop";

import { getHomeMultidata, getHomeGoods } from "network/home";
import { debounce } from "common/utils";

export default {
  name: "Home",
  components: {
    HomeSwiper,
    RecommendView,
    FeatureView,
    NavBar,
    TabControl,
    GoodList,
    Scroll,
    BackTop,
  },
  data() {
    return {
      banners: [],
      recommends: [],
      goods: {
        pop: { page: 0, list: [] },
        new: { page: 0, list: [] },
        sell: { page: 0, list: [] },
      },
      currentType: "pop",
      isShowBackTop: false,
      tabOffsetTop: 0,
      isTabFixed: false,
      saveY: 0,
    };
  },
  computed: {
    // 实时监测Home组件data中的goods对象数据变化 并将其及时传给GoodList
    showGoods() {
      return this.goods[this.currentType].list;
    },
  },
  // destroyed() {
  //   console.log("home destroyed");
  // },
  //activated deactivated只有在<keep-alive></keep-alive>使用时才有效
  activated() {
    // 让Home组件重新滚动到离开前的位置
    this.$refs.scroll.scrollTo(0, this.saveY, 0);
    // 刷新一下确保scroll插件重新计算高度高度
    this.$refs.scroll.refresh();
  },
  // Home组件销毁前保存页面滚动到哪个位置
  deactivated() {
    this.saveY = this.$refs.scroll.getScrollY();
  },

  created() {
    // 1.请求多个数据
    this.getHomeMultidata();

    // 2.请求商品数据
    this.getHomeGoods("pop");
    this.getHomeGoods("new");
    this.getHomeGoods("sell");
  },
  mounted() {
    // 1.图片加载完成的事件监听
    //请求同样的数据时 可以防止过快的向服务器请求数据
    const refresh = debounce(this.$refs.scroll.refresh, 50);
    this.$bus.$on("itemImageLoad", () => {
      refresh();
    });
  },
  methods: {
    /**
     * 事件监听相关的方法
     */
    tabClick(index) {
      switch (index) {
        case 0:
          this.currentType = "pop";
          break;
        case 1:
          this.currentType = "new";
          break;
        case 2:
          this.currentType = "sell";
          break;
      }
      // 将子组件传过来的index赋值给组件tabControl1和组件tabControl2 确保用户在不同位置点击的组件更新到一致
      this.$refs.tabControl1.currentIndex = index;
      this.$refs.tabControl2.currentIndex = index;
    },
    backClick() {
      this.$refs.scroll.scrollTo(0, 0);
    },
    contentScroll(position) {
      // 1.判断BackTop是否显示 当scroll传过来的position中的y值小于-1000时 说明页面已经滚动到了-1000的位置
      this.isShowBackTop = -position.y > 1000;

      // 2.决定tabControl是否吸顶 (但是position: fixed不可行 因为scroll插件里面的content元素会被添加一个translate属性)
      this.isTabFixed = -position.y >= this.tabOffsetTop;
    },
    loadMore() {
      this.getHomeGoods(this.currentType);
    },
    swiperImageLoad() {
      // 轮播图加载完毕之后 获取tabControl2距离#home顶部的距离 使用offsetTop父元素必须具有非static定位
      // console.log(this.$refs.tabControl2.$el);
      this.tabOffsetTop = this.$refs.tabControl2.$el.offsetTop;
      // console.log(this.tabOffsetTop);
    },
    /**
     * 网络请求相关的方法
     */
    getHomeMultidata() {
      getHomeMultidata().then((res) => {
        console.log(res);
        this.banners = res.data.banner.list;
        this.recommends = res.data.recommend.list;
      });
    },
    // 网络请求获取goods下一页的数据 并更新data中的goods对象
    getHomeGoods(type) {
      const page = this.goods[type].page + 1;
      getHomeGoods(type, page).then((res) => {
        // console.log(res);
        // 更新Home组件data中的goods对象数据
        this.goods[type].list.push(...res.data.list);
        this.goods[type].page += 1;

        // 完成上拉加载更多
        this.$refs.scroll.finishPullUp();
      });
    },
  },
  // updated() {
  //   console.log(this.$refs.tabControl2.$el.offsetTop);
  // },
};
</script>

<style scoped>
#home {
  /*padding-top: 44px;*/
  height: 100vh;
  position: relative;
}

.home-nav {
  background-color: var(--color-tint);
  color: #fff;

  /*在使用浏览器原生滚动时, 为了让导航不跟随一起滚动 使用fixed 但是scroll插件会给content加上translate 即使有fixed属性也会一起移动*/
  /*position: fixed;*/
  /*left: 0;*/
  /*right: 0;*/
  /*top: 0;*/
  /*z-index: 9;*/
}

/* 方法一 让content脱标 tabControl1不脱标 */
/* .content {
  overflow: hidden;
  position: absolute;
  top: 44px;
  bottom: 49px;
  left: 0;
  right: 0;
} 
.tab-control1 {
  position: relative;
  z-index: 9;
} */

/* 1、当tabControl1不脱标显示出来的时候 content会被它挤到下面 tab-control2距离顶部的距离就不再是以#home为标准 而是以tab-control1为标准 因为tab-control1和tab-control2不重叠 因此视觉就不流畅
  2、为了避免这种问题 可以让tabControl1脱标 或者让content脱标 */
/* 方法二、tabControl1脱标 content不脱标 */
.content {
  height: calc(100vh - 93px);
  overflow: hidden;
  /* 不需要添加margin-top */
  /* margin-top: 44px; */
}
.tab-control1 {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 9;
}
</style>
