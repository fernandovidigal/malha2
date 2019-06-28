
/**
 * Element.closest() polyfill
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.closest) {
	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}
	Element.prototype.closest = function (s) {
		var el = this;
		var ancestor = this;
		if (!document.documentElement.contains(el)) return null;
		do {
			if (ancestor.matches(s)) return ancestor;
			ancestor = ancestor.parentElement;
		} while (ancestor !== null);
		return null;
	};
}

var msgCloseBtn = document.querySelector('.msg_close');

if(msgCloseBtn){
    var msgBlock = msgCloseBtn.parentNode;
    let showTimer;

    showTimer = setTimeout(() => {
        msgBlock.remove();
    }, 5000);

    msgCloseBtn.addEventListener('click', function(e){
        e.preventDefault();
        msgBlock.remove();
        showTimer.clearTimeout;
    });
}