export function debounce(func, delay) {
  let timer = null;
  return function(...args) {
    //timer在定时器触发之前不会被注销
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
