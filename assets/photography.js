// made by steffan
// contact@steffanj.uk

$(function () {
  var base = 'assets/photography/';
  var scale = 1;
  var MIN = 0.5;
  var MAX = 5;
  var tx = 0, ty = 0;
  var drag = false;
  var dragStartX, dragStartY;

  function applyTransform() {
    $('#lightbox img').css('transform', 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')');
  }

  function resetTransform() {
    scale = 1;
    tx = 0;
    ty = 0;
    $('#lightbox img').css('transform', '');
  }

  function closeLightbox() {
    $('#lightbox').removeClass('active');
    resetTransform();
    $('#lightbox-exif').addClass('hidden').empty();
  }

  function openLightbox(src) {
    resetTransform();
    var $img = $('#lightbox img');
    var $exif = $('#lightbox-exif');

    $img.attr('src', src);
    $exif.addClass('hidden').empty();
    $('#lightbox').addClass('active');

    exifr.parse(src).then(function (exif) {
      console.log('EXIF:', exif);
      if (!exif) return;
      var parts = [];
      if (exif.Make || exif.Model) parts.push('<span>Camera</span>' + [exif.Make, exif.Model].filter(Boolean).join(' '));
      if (exif.FNumber) parts.push('<span>f/</span>' + exif.FNumber);
      if (exif.ExposureTime) parts.push('<span>Exp</span>' + (exif.ExposureTime < 1 ? '1/' + Math.round(1 / exif.ExposureTime) : exif.ExposureTime) + 's');
      if (exif.ISO) parts.push('<span>ISO</span>' + exif.ISO);
      if (exif.FocalLength) parts.push('<span>FL</span>' + exif.FocalLength + 'mm');
      if (parts.length) {
        $exif.html(parts.map(function (p) { return '<div>' + p + '</div>'; }).join('')).removeClass('hidden');
      }
    }).catch(function (err) { console.warn('EXIF error:', err); });
  }

  $.getJSON(base + 'manifest.json', function (data) {
    for (var i = data.photos.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = data.photos[i];
      data.photos[i] = data.photos[j];
      data.photos[j] = temp;
    }

    $.each(data.photos, function (_, filename) {
      var $slot = $('<div class="photo-slot loading"></div>');
      var $img = $('<img>').attr('alt', '');

      $img.on('load', function () {
        $slot.removeClass('loading');
        $(this).addClass('loaded');
      }).attr('src', base + filename);

      $img.on('click', function () {
        openLightbox($(this).attr('src'));
      });

      $slot.append($img);
      $('#grid').append($slot);
    });
  });

  // close button
  $('#lightbox-close').on('click', function (e) {
    e.stopPropagation();
    closeLightbox();
  });

  // background close
  $('#lightbox').on('click', function (e) {
    if ($(e.target).is('#lightbox')) closeLightbox();
  });

  // nice mousewheel zoom 
  $('#lightbox').on('wheel', function (e) {
    e.preventDefault();
    var delta = e.originalEvent.deltaY < 0 ? 1.12 : 0.88;
    var newScale = Math.min(MAX, Math.max(MIN, scale * delta));

    // some fucky math to make zoom center on mouse not the picture
    var lb = this.getBoundingClientRect();
    var mx = e.clientX - (lb.left + lb.width / 2);
    var my = e.clientY - (lb.top + lb.height / 2);

    // transform translation
    tx = mx - (mx - tx) * (newScale / scale);
    ty = my - (my - ty) * (newScale / scale);
    scale = newScale;
    applyTransform();
  });

  // dragging to move picture about, works good enough
  $('#lightbox img').on('mousedown', function (e) {
    e.preventDefault();
    drag = true;
    dragStartX = e.clientX - tx;
    dragStartY = e.clientY - ty;
    $(this).css('cursor', 'grabbing');
  });
  $(document).on('mousemove', function (e) {
    if (!drag) return;
    tx = e.clientX - dragStartX;
    ty = e.clientY - dragStartY;
    applyTransform();
  });
  $(document).on('mouseup', function () {
    if (!drag) return;
    drag = false;
    $('#lightbox img').css('cursor', 'grab');
  });

});
