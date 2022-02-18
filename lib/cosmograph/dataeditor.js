// Set the first editor
resetEditorElements();
editSettingsData();

// Handle Navigation ------------------------------------------------------------------------

$("#editorNav span").click(function(e){
    if (e.target.id != "mainMapButton"){
        $(e.currentTarget).parent().find("span").removeClass("active");
        $(e.target).addClass("active");
        resetEditorElements();
        switch(e.target.id){
            case "generalEditorButton":
                editSettingsData();
                break;
            case "mapEditorButton":
                editMapData();
                break;
            case "navEditorButton":
                editNavData();
                break;
            case "troubleshootingButton":
                viewTroubleshooting();
                break;
        }
    }else{
        var win = window.open('index.html', '_blank');
        if (win) {
            //Browser has allowed it to be opened
            win.focus();
        } else {
            //Browser has blocked it
            toast('Unable to open map. You may need to allow popups for this page.', false);
        }
    }
});

// Build Editors ----------------------------------------------------------------------------

function editSettingsData(){
    buildEditor("../assets/data/settings.json", "schemas/schema_settings.json");
}

function editMapData(){
    buildEditor("../assets/data/mapdata.json", "schemas/schema_mapdata.json");
}

function editNavData(){
    buildEditor("../assets/data/navdata.json", "schemas/schema_navdata.json");
}

function viewTroubleshooting(){
    $("#editor_holder").html("The most common cause of problems with the Map is bad data. Minimal data validation is present in this app currently, so please make sure that coordinates are correct, required fields aren't left empty, etc.<br><br>While you get the hang of things, it may be best to make small changes (such as adding one marker) at a time, upload the new version, make sure it works, and then move on to the next.<br><br>Additional validation is planned for the future for fields that require it, but there is no ETA for that functionality at this time.");
}

function buildEditor(sourceJSONurl, schemaJSONurl){

    var promise = $.getJSON(sourceJSONurl);
    promise
    .then(function(data) { // We successfully got our data, so we can build our editor
        JSONEditor.defaults.theme = 'spectre';
        JSONEditor.defaults.iconlib = 'spectre';

        // the initial data for our JSON editor, pulled from our existing map data JSON
        var starting_value = data;
        var options = {
            // Enable fetching schemas via ajax
            ajax: true,                
            // The schema for the editor    
            schema: {
                $ref: schemaJSONurl
            },
            no_additional_properties: true,
            disable_properties: true,
            disable_edit_json: true,
            startval: starting_value
        };
    
        // Clear the loading text, otherwise it will stay visible.
        $("#editor_holder").text("");

        const element = document.getElementById('editor_holder');
        const editor = new JSONEditor(element, options);

        // Set up our 'save' function that lets users copy the JSON to the clipboard
        $('#copyToClipboard').click(function(){
            // Get the value from the editor
            navigator.clipboard.writeText(JSON.stringify(editor.getValue(), undefined, 2)).then(function () {
                toast("JSON Saved to Clipboard", true);
            }, function () {
                toast("Failure to copy. Check permissions for clipboard", false);
            });
        });

    })
    .catch(function(err){
        toast("An error occurred while attempting to load your data.", true);
    });
}

// Helper Functions -------------------------------------------------------------------------

function resetEditorElements(){
    // Remove the elements so that we clear the editor and any associated event handlers.
    $("#editor_holder").empty();
    // Just in case, let's put some loading text in there. Users will probably never see this.
    $("#editor_holder").text("Loading...");
    $("#copyToClipboard").remove();
    // Add the elements back in.
    // $("body").append("<div id='editor_holder'></div>");
    $("body").append("<div id='copyToClipboard' title='Copy JSON to Clipboard'><i class='fas fa-clipboard'></i></div>");
}

function toast(message, isGood){
    // Basic function to simplify making toast. A toaster, if you will.
    var color;
    if(isGood){
        color = "LINEAR-GRADIENT(TO RIGHT, RGB(95, 84, 252), RGB(126, 158, 251))";
    }else{
        color = "LINEAR-GRADIENT(TO RIGHT, RGB(238, 58, 94), RGB(238, 124, 124))";
    }
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        style: {
            background: color,
        }
    }).showToast();
}