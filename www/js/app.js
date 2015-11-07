function onAppReady() {
    /*
    if( navigator.splashscreen && navigator.splashscreen.hide ) {   // Cordova API detected
        navigator.splashscreen.hide() ;
    }
    */
}
document.addEventListener("deviceready", onAppReady, false) ;

var MAX_ITEMS = 15;
var data = [];
var dataURL = "";
var dataID = 0;
var baseURL = "";
var search = "";

function getWebRoot() {
    "use strict";
    var path = window.location.href;
    path = path.substring( 0, path.lastIndexOf('/') );
    return path;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sanitizeAndLower(str) {
    var res = str.replace(/[^a-zA-Zа-яА-Я]/gi, '');
    return S(res).toLowerCase();
}

var cyrToLat = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"a","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"};

function transliterate(word){
    return word.split('').map(function (char) { 
        return cyrToLat[char] || char; 
    }).join("");
}

function highlightMeaning(str, dict) {
    var tag = 'b';
    if (dict == "en-bg")
        return str.replace(/([a-zA-Z '/-]{3,})/gi, '<em><b>$1</b></em>');
    else
        return str.replace(/([а-яА-Я '/-]{3,})/gi, '<em><b>$1</b></em>');
}

function initApp() {
    baseURL = getWebRoot();
}

function getDict(input) {
    if (!input) {
        return;
    }
    var char = S(input).left(1).toLowerCase();

    var dict = "";
    if (char.match(/[a-zA-z]/i)) {
        dict = "en-bg";
    }
    else if (char.match(/[а-яА-Я]/i)) {
        dict = "bg-en";
    }
    return dict;
}

function getLetterURL(input) {
    if (!input) {
        return;
    }
    var char = S(input).left(1).toLowerCase();

    var dict = getDict(input);
    if (!dict) {
        return;
    }
    
    var offset = 0;
    if (dict == "en-bg") {
        offset = 96;
    }
    else if (dict == "bg-en") {
        offset = 1071;
    }
    var dictURL = baseURL + "/data/" + dict;

    var code = char.charCodeAt(0);
    var order = code - offset;
    var letterURL = dictURL + "/d" + S(order).padLeft(2, "0") + ".json";
    return letterURL;
}

function quickFindItem(input) {
    input = sanitizeAndLower(input);
    var low = 0;
    var high = data.length - 1;
    var middle = -1;
    var c = 0;    
    while ((low + 1 < high) && (low < data.length) && (high >= 0)) {
        middle = Math.floor(((high - low) / 2) + low);
        var compare = sanitizeAndLower(data[middle].w);
        var res = input.localeCompare(compare);
        if (res > 0) {
            low = middle;
        }
        else if (res < 0) {
            high = middle;
        }
        else {
            break;
        }
        c++;
        if (c > 100)
        {
            console.log("check");
            middle = -1;
            break;
        }
    }
    
    return middle;
}

function loadList(index) {
    var $list = $("#word-list");
    var $pages = $("#pages");
    var input = $("#word-search").val();
    var dict = getDict(input);
    
    if (index < 0) {
        return;
    }
    
    var num = 0;
    for (var i = index; i < Math.min(index + MAX_ITEMS, data.length); i++)
    {
        num++;
        
        var word = data[i].w;
        var transcript = (data[i].t)
            ? '<hr><p class="caption transcript"><span>Pronunciation: </span>' +
              escapeHtml(data[i].t) +
              '</p>'
            : '';
        var firstLine = (data[i].m) ? S(data[i].m).split('\r\n', 1)[0] : "";
        var meaning = escapeHtml(data[i].m);
        var body = highlightMeaning(meaning, dict);
        body = S(body).replaceAll("\r\n", "<br>");
        var wordID = transliterate(sanitizeAndLower(word)) + "-" + num + "-" + Math.floor(Math.random() * 65534) + 1;
        
        $list.append('<li><a href="#' + wordID + '"><span class="definition">' + escapeHtml(word) + '</span><br><span class="first-meaning">' + escapeHtml(firstLine) + '</span></a></li>');
        
        $pages.append(
        '<div class="panel details" data-title="' + escapeHtml(word) + '" id="' + wordID + '" data-footer="none">' +
        '    <p class="caption word"><span>Word: </span>' + escapeHtml(word) + '</p>' +
        transcript +
        '    <hr> ' +
        '    <p class="caption meaning"><span>Meaning:<br></span>' + body + '</p>' +
        '</div>'
        );
    }
}

function clearWords() {
    $("#word-list").empty();
    $(".pages .details").empty();
}

function loadWords(input) {
    if (!input) {
        return;
    }
    
    if ((!data) || (data.length === 0)) {
        return;
    }
    
    var index = -1;
    var count = 0;
    do {
        index = quickFindItem(input);
        if (index < 0) {
            if (input.length > 0)
                input = S(input).left(input.length - 1);
            else
                input = "";
        }
        
        count++;
    } while ((index < 0) && (input !== "") && (count < 10));
    
    if (count >= 10) {
        index = -1;
    }
    
    loadList(index);
}

function loadData(input, url) {
    dataID++;
    var tempID = dataID;
    var search = input;

    $.getJSON(url)
    .done(function(json) {
        if (tempID < dataID) {
            return;
        }
        
        data = json;
        dataURL = url;
        
        if (search) {
            clearWords();
            loadWords(search);
        }
    })
    .fail(function(jqxhr, textStatus, error) {
        console.log("get error");
    })
    .always(function() {
        console.log("finished");
    });
}

function checkLoadData(input, url) {
    if (dataURL != url) {
        loadData(input, url);
        return false;
    }
    
    return true;
}

function inputChange() {
    var input = $("#word-search").val();
    var letterURL = getLetterURL(input);

    checkLoadData("", letterURL);
}

function inputChanged() {
    var input = $("#word-search").val();
    var letterURL = getLetterURL(input);

    if (checkLoadData(input, letterURL)) {
        clearWords();
        loadWords(input);
    }
}

// The app.Ready event shown above is generated by the init-dev.js file; it
// unifies a variety of common "ready" events. See the init-dev.js file for
// more details. You can use a different event to start your app, instead of
// this event. A few examples are shown in the sample code above. If you are
// using Cordova plugins you need to either use this app.Ready event or the
// standard Crordova deviceready event. Others will either not work or will
// work poorly.

// NOTE: change "dev.LOG" in "init-dev.js" to "true" to enable some console.log
// messages that can help you debug Cordova app initialization issues.
