/* Section sidebar scroll-spy (technology / science pages).
   Highlights the section nearest the top of the viewport and smooth-scrolls on click.
   Same-origin, no dependencies; no-ops if there is no .doc-nav on the page. */
(function () {
  var nav = document.querySelector('.doc-nav');
  if (!nav) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll('.doc-nav-link'));
  var byId = {};
  var sections = [];

  links.forEach(function (a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    var sec = id && document.getElementById(id);
    if (!sec) return;
    byId[id] = a;
    sections.push(sec);
    a.addEventListener('click', function (e) {
      e.preventDefault();
      // Don't set the target active immediately — let the observer drive it as the page
      // smooth-scrolls, so the active marker slides from the current section to the target
      // instead of jumping ahead and snapping back.
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
  });

  function setActive(id) {
    links.forEach(function (a) { a.classList.toggle('is-active', a === byId[id]); });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      for (var i = 0; i < sections.length; i++) {
        if (visible[sections[i].id]) { setActive(sections[i].id); break; }
      }
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }
})();
