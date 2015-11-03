/*
	These functions serve CSS animations for animated face.
	The basic code was taken from this jsfiddle: http://jsfiddle.net/apaul34208/djq68/21/
	
	Modified by: Hammad Tariq
	Modified on: 02 November, 2015
*/

function blink() {
    $('.lidT').animate({
        top: '-40'
    }, 500).delay(200).animate({
        top: '-80'
    });
    $('.lidB').animate({
        bottom: '-40'
    }, 500).delay(200).animate({
        bottom: '-80'
    });
}

function look() {
    $('.pup').animate({
        'left': '80'
    }, 500).delay(200).animate({
        'left': '0'
    }, 700).delay(200).animate({
        left: 40
    });
}

function both() {
    $('.lidT').animate({
        top: '-40'
    }, 500).delay(200).animate({
        top: '-80'
    });
    $('.lidB').animate({
        bottom: '-40'
    }, 500).delay(200).animate({
        bottom: '-80'
    });
    $('.pup').delay(900).animate({
        'left': '80'
    }, 500).delay(200).animate({
        'left': '0'
    }, 700).delay(200).animate({
        left: 40
    });
}

function scared() {
    $('.lidT').animate({
        top: '-100'
    }, 800).delay(100).animate({
        top: '-40'
    }, 500).delay(100).animate({
        top: '-80'
    });
    $('.lidB').animate({
        bottom: '-100'
    }, 800).delay(100).animate({
        bottom: '-40'
    }, 500).delay(100).animate({
        bottom: '-80'
    });
    $('.pup').animate({
        'height': '50',
        'width': '50',
        top: '25',
        left: '25'
    }, 500).delay(200).animate({
        'height': '20',
        'width': '20',
        top: '40',
        left: '40'
    });
}