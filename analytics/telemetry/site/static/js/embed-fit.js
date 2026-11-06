/* Fits an embedded same-origin frame to its content.
   A frame marked data-fit posts {scoutFit: <height in px>} to its parent whenever its content changes
   (the design explorer on the Technology page does). Same-origin only; without it the frame keeps its CSS height. */
(function () {
  addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || !e.data.scoutFit) return;
    var frames = document.querySelectorAll('iframe[data-fit]');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === e.source) frames[i].style.height = e.data.scoutFit + 'px';
    }
  });
})();
