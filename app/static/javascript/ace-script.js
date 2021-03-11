var isIndented = false;

//----------------------- Editor 1 section -----------------------//
var editor1 = ace.edit("editor1", {
    fontFamily: 'IBM Plex Mono',
    fontSize: '10pt',
    theme: "ace/theme/tomorrow",
    mode: "ace/mode/python",
    setShowPrintMargin: false,
});
const clearBtnEditor1 = document.getElementById("button-clear-editor1");

clearBtnEditor1.addEventListener('click', () => {
    // clear's the editor1 
    editor1.setValue('');
});


//------------------------ Editor 2 section -----------------------//
var editor2 = ace.edit("editor2", {
    fontFamily: 'IBM Plex Mono',
    fontSize: '10pt',
    theme: "ace/theme/tomorrow",
    mode: "ace/mode/json",
    setShowPrintMargin: false,
    readOnly: true
});

// Clears the editor2 screen
const clearBtnEditor2 = document.getElementById("button-clear-editor2");

clearBtnEditor2.addEventListener('click', () => {
    // clear's the editor2
    editor2.setValue('');
    indent_editor2_btn.style.cssText = 'color: #393e46;';
    isIndented = false;
});

// function to indent editor2
const indent_editor2_btn = document.querySelector('#indent-button-editor2');

function indent2() {
    if (isIndented) {
        editor2.setValue(JSON.stringify(JSON.parse(editor2.getValue())));
        isIndented = false;
        indent_editor2_btn.style.cssText = 'color: #393e46;';
    } else {
        editor2.setValue(JSON.stringify(JSON.parse(editor2.getValue()), null, 4));
        isIndented = true;
        indent_editor2_btn.style.cssText = 'color: #f7f7f7; background-color: #393e46;';
    }
}


// Easy-MQL query converter
function convert() {
    // check for minimum two character available
    if (editor1.getValue().length >= 2) {
        // Ajax http request
        httpRequest = new XMLHttpRequest();
        editor1_body = editor1.getValue();
        httpRequest.onreadystatechange = function () {
            if (this.readyState == 4 ) {
                if (this.status == 200) {
                    editor2.setValue(JSON.stringify(JSON.parse(this.responseText), null, 4));
                    isIndented = true;
                    indent_editor2_btn.style.cssText = 'color: #f7f7f7; background-color: #393e46;';
                } else {
                    editor2.setValue(JSON.parse(this.responseText).error);
                }
            }
        }
        httpRequest.open('POST', '/convert');
        httpRequest.send(editor1_body);
    } else {
        editor2.setValue("Nothing to convert");
    }
}

// Get the modal
var modal = document.getElementById("connectModal");

function connect_button() {
    // When the user clicks the button, open the modal
    modal.style.display = "block";

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
      modal.style.display = "none";
    }
}

// connection to the mongo
const connect_mongo = document.getElementById("connect_mongo");

connect_mongo.addEventListener('click', () => {
    $('.modal-error').html('');
    document.getElementById("loading").style.visibility = "visible";
    // Ajax http request
    mongoHttpRequest = new XMLHttpRequest();
    mongoUrl = document.getElementById('mongo-url').value;
    mongoHttpRequest.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200 ) {
            // change connect button to disabled vice-versa with disconnect button
            $(".connect").addClass("disabled");
            $(".disconnect").removeClass("disabled");
            // change the color of db-icon to lime
            document.getElementById('button-connect').style.cssText = 'color: lime;';
            console.log(JSON.stringify(JSON.parse(this.responseText), null, 4));
            // closes the pop up window after the connection to db
            modal.style.display = "none";
            array = JSON.parse(this.responseText)
            var newHTML = [];
            for (var i = 0; i < array.length; i++) {
                newHTML.push('<button class="btn-sm dropdown-item" onClick="select_dbs()">' + array[i] + '</button>');
            }
            $(".dropdown-db").html(newHTML.join(''));
            $('.modal-content button').text('Connect');
        } else if ( this.status == 500 ) {
            $('.modal-error').html('<p>Internal server error check your mongo connection</p>');
            $('.modal-content button').text('Re-connect');
            $('#loading').css("visibility",'hidden');
        }
    }
    mongoHttpRequest.open('POST', '/connect');
    mongoHttpRequest.send(mongoUrl);
});


function select_dbs() {
    selected_db = event.target.innerText;
    console.log("selected db = "+selected_db);
    document.getElementById('dropdownSelectedDbButton').innerText = selected_db;
    collectionHttpRequest = new XMLHttpRequest();
    collectionHttpRequest.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200 ) {
            collectionsArray = JSON.parse(this.responseText);
            console.log(collectionsArray);
            var newHTMLs = [];
            for (var i = 0; i < collectionsArray.length; i++) {
                newHTMLs.push('<button class="btn-sm dropdown-item" onClick="select_collection()">' + collectionsArray[i] + '</button>');
            }
            $(".dropdown-collection").html(newHTMLs.join(''));
        }
    }
    collectionHttpRequest.open('GET', '/dbs/'+selected_db+'/collections');
    collectionHttpRequest.send();
}

function select_collection() {
    selected_collection = event.target.innerText;
    console.log("selected collection = "+selected_collection);
    document.getElementById('dropdownSelectedCollectionButton').innerText = selected_collection;
    documentsHttpRequest = new XMLHttpRequest();
    documentsHttpRequest.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200 ) {
            editor2.setValue(JSON.stringify(JSON.parse(this.responseText), null, 4));
            console.log(BSON.deserialize(this.responseText));
            isIndented = true;
            indent_editor2_btn.style.cssText = 'color: #f7f7f7; background-color: #393e46;';
        }
    }
    documentsHttpRequest.open('GET', '/dbs/'+selected_db+'/collections/'+selected_collection+'/docs');
    documentsHttpRequest.send();
}

function disconnect_button() {
    document.getElementById("loading").style.visibility = "hidden";
    dbDisconnectHttpRequest = new XMLHttpRequest();
    dbDisconnectHttpRequest.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 204 ) {
            $(".connect").removeClass("disabled");
            $(".disconnect").addClass("disabled");
            $(".dropdown-collection").html('<button class="btn-sm dropdown-item">Empty</button>');
            $(".dropdown-db").html('<button class="btn-sm dropdown-item">Empty</button>');
            document.getElementById('dropdownSelectedDbButton').innerText = "Select db";
            document.getElementById('dropdownSelectedCollectionButton').innerText = "Select collection";
            document.getElementById('button-connect').style.cssText = 'color: #393e46;';
            document.querySelector('#indent-button-editor2').style.cssText = 'color: #393e46;';
            isIndented = false;
            // clear's the editor2
            editor2.setValue('');
        } else {
            console.log("Not disconnected");
        }
    }
    dbDisconnectHttpRequest.open('POST', '/disconnect');
    dbDisconnectHttpRequest.send();
}

$('document').ready(function(){
    $(".disconnect").addClass("disabled");
});

// Get the export-modal
var exportModal = document.getElementById("exportModal");
var exportTextarea = document.getElementById('export-textarea-content');
function export_clipboard() {
    // When the user clicks the button, open the modal
    exportModal.style.display = "block";

    // Get the <span> element that closes the modal
    let span = document.getElementById("export-close");

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
      exportModal.style.display = "none";
    }

    exportTextarea.value = JSON.stringify(JSON.parse(editor2.getValue()), null, 4);
}

function copy() {
    exportTextarea.select();
    document.execCommand('copy');
}


function download_query() {
    // On click download button, download the file

    var text = document.getElementById("export-textarea-content").value;
    
    var ele = document.createElement('a');
    ele.style.display = 'none';

    ele.setAttribute('href', 'data:json/plain;charset-utf-8,' + encodeURIComponent(text));

    ele.setAttribute('download', "query.json");
    document.body.appendChild(ele);

    ele.click();
    document.body.removeChild(ele);
}