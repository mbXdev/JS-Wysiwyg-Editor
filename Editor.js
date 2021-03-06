window.addEventListener("load", function() {
    // Récupération de la balise DIV de l'éditeur
    var editor = document.getElementById("JWE_inputContent");
    // Ajouter une balise P si l'éditeur est vide
    if (!editor.innerHTML || editor.innerHTML.length === 0 || !editor.innerHTML.trim() || editor.innerHTML.match(/^ *<br> *$/i)) editor.innerHTML = '<p><br></p>';
    // insertion de la boîte de dialogue dans le code HTML
    InsertDialog();
    // Evènement Input sur l'éditeur
    editor.oninput = function() {
        var s = document.getSelection();
        // Si l'éditeur est vide: Annuler la dernière action puis remplacer le contenu de l'éditeur par '<p><br></p>'
        if (editor.innerHTML == "") {
            document.execCommand('undo');
            // Si l'éditeur contient autre chose que <p><br></p>
            if (editor.innerHTML != "<p><br></p>") {
                selectNodeContents(editor);
            }
            document.execCommand('forwardDelete');
            // Si la sélection se trouve dans une balise h1
            if (s.focusNode.nodeName == 'H1') {
                document.execCommand('formatBlock', false, 'p');
            }
            return; // Inutile de continuer étant donnée qu'on a annulé l'action...
        }
        // Si après une action, la sélection se trouve directement dans l'éditeur (donc sans balise) :
        // Annuler la dernière action.
        else if (s.focusNode == editor) {
            document.execCommand('undo');
            return; // Inutile de continuer étant donnée qu'on a annulé l'action...
        }

        var cNode = GetContainerNode();
        var offsetCache = s.focusOffset;
        // Suppréssion des SPAN (créé à cause d'un bug:
        // 1 - Ecrire du texte.
        // 2 - Sélectionner la partie la plus à gauche du texte.
        // 3 - Appuyer sur la touche "Enter" pour repousser le texte d'une ligne.
        // 4 (fin) - Appuyer sur la touche "Back".
        if (deleteSpanOnInput && editor.innerHTML.match(/<span [^>]*>/i)) {
            if (cNode.innerHTML.match(/<span [^>]*>/i)) {
                var newRange = document.createRange();
                newRange.selectNodeContents(cNode);
                var winSelection = window.getSelection();
                winSelection.removeAllRanges();
                winSelection.addRange(newRange);
                //cNode.innerHTML = cNode.innerHTML.replace(/<span [^>]*>((?:.(?<!(?:<br>)?<\/span>))*)(?:<br>)?<\/span>(?:<br>)?/i, '$1');
                var html = cNode.innerHTML.replace(/<span [^>]*>((?:.(?<!(?:<br>)?<\/span>))*)(?:<br>)?<\/span>(?:<br>)?/i, '$1');
                document.execCommand('insertHTML', false, html);
            }
            if (editor.innerHTML.match(/<span [^>]*>/i)) {
                //editor.innerHTML = editor.innerHTML.replace(/<span [^>]*>((?:.(?<!(?:<br>)?<\/span>))*)(?:<br>)?<\/span>(?:<br>)?/ig);
            }
            var newRange = document.createRange();
            newRange.setStart(cNode, offsetCache);
            var winSelection = window.getSelection();
            winSelection.removeAllRanges();
            winSelection.addRange(newRange);
        }

        //document.getElementById("preview").innerHTML = html_specalEncode(document.getElementById("JWE_inputContent").innerHTML);
    }
    // Ne pas coller les éléments de styles
    editor.addEventListener("paste", function(e) {
        // Annuler le collage.
        e.preventDefault();
        // S'assurer qu'on ne colle pas du texte dans une balise H[1-6]
        disableSelectedHeaders();
        // Récupération du text brut dans le presse-papier
        var event = e.originalEvent != null ? e.originalEvent : e;
        var text = event.clipboardData.getData('text/plain');
        // Insérer chaque ligne dans une balise P
        text = text.replace(/(.+)/ig, '<p>$1</p>');
        // Correction d'un bug... La récupération du text créer parfois un caractère invisible (après de longue recherche, il sagirait de \r\n). A cause de lui, le code ne voulais pas s'afficher dans l'éditeur.
        text = text.replace(/[\r\n]+/ig, '<p><br></p>')
        // Remplacement des "<p></p>" par "<p><br></p>"
        text = text.replace(/<p><\/p>/ig, '');
        // Ajout du texte à l'emplacement de la sélection (remplace la sélection)
        document.execCommand("insertHTML", false, text);
    });
    // Evènement click sur le bouton VALIDER. Permet de néttoyer le code avant l'enregistrement
    document.getElementById("JWE_validate").onclick = function() {
        var content = document.getElementById("JWE_inputContent").innerHTML;
        content = content
        // Suppréssion des SPAN (créé à cause d'un bug:
        // 1 - Ecrire du texte.
        // 2 - Sélectionner la partie la plus à gauche du texte.
        // 3 - Appuyer sur la touche "Enter" pour repousser le texte d'une ligne.
        // 4 (fin) - Appuyer sur la touche "Back".
        .replace(/<span [^>]*>((?:.(?<!(?:<br>)?<\/span>))*)(?:<br>)?<\/span>(?:<br>)?/ig, '$1')
        // Remplace les conteneur vide par la balise de saut de ligne <br>.
        .replace(/<(p|div)><br><\/(p|div)>/mg, '<br>')
        // Remplace les balises <!> par <strong> inséré via le bouton "Important!".
        .replace(/&lt;(\/?)[!]&gt;/mg, '<$1strong>');
        document.getElementById("JWE_outputContent").value = content;
        //document.getElementById("preview").innerHTML = html_specalEncode(content);
    }
    // Utiliser la balise P au lieu de DIV
    document.execCommand('defaultParagraphSeparator', false, 'p');
});

var deleteSpanOnInput = true; // Indique qu'il faut supprimer les spans dans le texte après chaque entrée/modification dans l'éditeur

// Utiliser cette méthode pour charger le contenu dans l'éditeur
function loadContent(content) {
    // Remplacer les balises <br> par <p><br></p> pour éviterles bug
    content = content.replace(/<br>/ig, '<p><br><\/p>');
    document.getElementById("JWE_inputContent").innerHTML = content;
    // Récupération de la balise DIV de l'éditeur
    var editor = document.getElementById("JWE_inputContent");
    // Ajouter une balise P si l'éditeur est vide
    if (!editor.innerHTML || editor.innerHTML.length === 0 || !editor.innerHTML.trim() || editor.innerHTML.match(/^ *<br> *$/i)) editor.innerHTML = '<p><br></p>';
}











/* ******************************************** */
/* Boîte de dialogue pour l'ajout de formulaire */
/* ******************************************** */
var diagForm_rowNumberValue = 1;
var diagForm_columnNumberValue = 1;
var diagForm_headerValue = "without";
var diagForm_nodefocusCache; // Mise en mémoire du noeud où se trouvait le focus dans l'éditeur avant d'avoir cliqué sur le bouton "Form".
var diagForm_offsetfocusCache; // Mise en mémoire de la position sur le noeud où se trouvait le focus dans l'éditeur avant d'avoir cliqué sur le bouton "Form".
var diagForm_containerNodeCache;// Mise en mémoire du noeud CONTENEUR où se trouvait le focus dans l'éditeur avant d'avoir cliqué sur le bouton "Form".
// Ouvre la boîte de dialogue
function openDialogForm() {
    if (typeof diagForm.showModal === "function") {
        // Réinitialisation des variables
        diagForm_rowNumber = 1;
        diagForm_columnNumber = 1;
        diagForm_headerValue = "without";
        diagForm_nodefocusCache = null;
        diagForm_offsetfocusCache = null;
        diagForm_containerNodeCache = null;
        // Mise en mémoire du noeud et de la position sur le noeud où se trouvait le focus dans l'éditeur avant d'avoir cliqué sur le bouton "Form".
        diagForm_containerNodeCache = GetContainerNode();
        var IsEditorSelection = parentIdOfSelectionExists("JWE_inputContent", 10);
        if (!IsEditorSelection || diagForm_containerNodeCache == null) {
            alert('error: dialog001. Vous devez cibler une zone dans l\'éditeur.'); // Ne rien faire si le noeud du conteneur n'est pas trouvé.
            return;
        }
        var s = document.getSelection();
        diagForm_nodefocusCache = s.focusNode;
        diagForm_offsetfocusCache = s.focusOffset;
        // Affichage de la boîte de dialogue
        diagForm.showModal();
    }
    else console.error("The dialog for inserting a form is not supported by your browser.");
}
function onChangeDiagFormRowNumber() {
    var diagForm_rowNumber = document.getElementById('diagForm_rowNumber');
    diagForm_rowNumberValue = diagForm_rowNumber.value;
}
function onChangeDiagFormColumnNumber() {
    var diagForm_columnNumber = document.getElementById('diagForm_columnNumber');
    diagForm_columnNumberValue = diagForm_columnNumber.value;
}
function onChangeDiagFormHeader() {
    var diagForm_header = document.getElementById('diagForm_header');
    diagForm_headerValue = diagForm_header.value;
}
// Lorsque la boîte de dialogue se ferme
function onCloseDialogForm() {
    var diagForm = document.getElementById('diagForm');
    if (diagForm.returnValue == 'ok') {
        createTable(diagForm_rowNumberValue,
            diagForm_columnNumberValue,
            diagForm_headerValue,
            diagForm_containerNodeCache);
    }
}
// Créer une table après le noeud indiqué en paramètre
function createTable(row, col, header, node) {
    if (row == 0 || col == 0 || header == "" || node == null) return;

    var table = document.createElement('table');
    // row
    for (let rIndex = 0; rIndex < row; rIndex++) {
        var tr = document.createElement('tr');
        // td
        for (let cIndex = 0; cIndex < col; cIndex++) {
            var c;
            switch (header) {
                case 'firstRow':
                    if (rIndex == 0) c = document.createElement('th');
                    else c = document.createElement('td');
                    break;
                case 'firstColumn':
                    if (cIndex == 0) c = document.createElement('th');
                    else c = document.createElement('td');
                    break;
                case 'firstRowAndfirstColumn':
                    if (rIndex == 0 || cIndex == 0) c = document.createElement('th');
                    else c = document.createElement('td');
                    break;
            
                default:
                    c = document.createElement('td');
                    break;
            }
            c.innerText = 'texte';
            tr.append(c);
        }

        table.append(tr);
    }
    selectNode(node);
    var dTmp = document.createElement('div');
    var pAfterTable = document.createElement('p');
    pAfterTable.append(document.createElement('br'));
    dTmp.append(node.cloneNode(true));
    dTmp.append(table);
    dTmp.append(pAfterTable);
    document.execCommand('insertHTML', false, dTmp.innerHTML);
}

function InsertDialog() {
    // Boîte de dialogue pour le paramétrage du tableau à ajouter
    var d = document.createElement('div');
    d.innerHTML += `<dialog id="diagForm" onClose="onCloseDialogForm();">
    <form method="dialog">
        <label for="diagForm_rowNumber">Number of rows</label>
        <select id="diagForm_rowNumber" onChange="onChangeDiagFormRowNumber();">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
        <option value="11">11</option>
        <option value="12">12</option>
        <option value="13">13</option>
        <option value="14">14</option>
        <option value="15">15</option>
        <option value="16">16</option>
        <option value="17">17</option>
        <option value="18">18</option>
        <option value="19">19</option>
        <option value="20">20</option>
        </select>
        <label for="diagForm_columnNumber">Number of columns</label>
        <select id="diagForm_columnNumber" onChange="onChangeDiagFormColumnNumber();">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
        </select>
        
        <label>Header</label>
        <select id="diagForm_header" onChange="onChangeDiagFormHeader();">
        <option value="without">Without</option>
        <option value="firstRow">First row</option>
        <option value="firstColumn">First column</option>
        <option value="firstRowAndfirstColumn">First row and first column</option>
        </select>
        
        <menu>
        <button value="cancel">Cancel</button>
        <button id="diagForm_btnValidate" value="ok">Validate</button>
        </menu>
    </form>
</dialog>`;

    document.getElementById("JWE_form").after(d);
}
/* *************************************************** */
/* FIN -- Boîte de dialogue pour l'ajout de formulaire */
/* *************************************************** */


// Récupère le conteneur principal de la sélection. (Utiliser GetListNode() pour récupérer une liste UL ou OL)
function GetContainerNode() {
    selection = document.getSelection();
    if (document.getSelection().rangeCount == 0) return null;
    node = selection.focusNode;
    for (var index = 0; index < 15; index++) {
        if (node.id == "JWE_inputContent") return null; // Arrêter la function si on atteint les limites de l'éditeur.
        // Vérifie si c'est un conteneur. <!>Attention ! Ne pas utiliser pour rechercher les balises UL ou OL, car une balise P peut être trouvé avant (dans le cas où seul, le texte d'une ligne de liste serait sélectionné).
        if (String(node.nodeName).match(/^p|h[123456]|table|div$/i)) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

// Récupère l'élément UL ou OL, parent du noeud indiqué en paramètre
function GetListNode(node) {
    return findNode(node, '^ul|ol$');
}

// Récupère l'élément parent indiqué via le pattern.
function findNode(node, pattern, option = 'i') {
    if (!node) return null;
    if (!pattern) {
        alert('error: fatal error 01');
        return;
    }
    for (var index = 0; index < 15; index++) {
        if (node.id == "JWE_inputContent") return null; // Arrêter la function si on atteint les limites de l'éditeur.
        var regex = new RegExp(pattern, option);
        if (String(node.nodeName).match(regex)) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

// Encode les balises <br> en \n (saut d ligne) et les caractères utilisé pour les balises HTML.
function html_specalEncode(str) {
    return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(&lt;\/?(?:div|p|img|ul|li|table|t[rhd]|h[123])&gt;)/g, "$1<br>") // Balise container..
    .replace(/(&lt;\/(?:div|p|img|ul|li|table|t[rhd]|h[123])&gt;)/g, "<br>$1")
    ;
}
// Décode les caractères utilisé pour les balises HTML et les saut de lignes \n.
function html_decode(str) {
    return str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\n/g, "<br>");
}

function insertTag(tagName, selection, secondValue = null, lineBreak = false) {
    if (tagName == null || tagName == "") alert("Une balise doit être défini.");
    var comp = "";
    if (lineBreak) comp = "\n";
    if (secondValue != null) return "<"+tagName+"="+secondValue+">"+comp+selection+comp+"</"+tagName+">";
    else return "<"+tagName+">"+comp+selection+comp+"</"+tagName+">";
}
function removeTag(tagName, selection) {
    if (tagName == null || tagName == "") alert("Une balise à supprimer doit être défini.");
    var regx = new RegExp('< *'+tagName+' *(?:=[^>]*)?>\n?((?:.|\n(?!< *\/ *'+tagName+' *>))*)\n?< *\/ *'+tagName+' *>', 'g');
    return String(selection).replace(regx, "$1");
}
function switchTag(tagName, selection, secondValue = null, lineBreak = false) {
    var str = String(selection);
    if (tagName == null || tagName == "") alert("Une balise doit être défini.");
    var regx = new RegExp('< *'+tagName+' *(?:=[^>]*)?>\n?((?:.|\n(?!< *\/ *'+tagName+' *>))*)\n?< *\/ *'+tagName+' *>', 'g');
    if (str.match(regx)) return removeTag(tagName, selection);
    else return insertTag(tagName, selection, secondValue, lineBreak);
}

// Fonction indiquant si une balise parente contient l'id indiqué en paramètre, dans la plage indiqué.
function parentIdOfSelectionExists(parentId, limit) {
    if (document.getSelection().rangeCount == 0) return false;
    selection = document.getSelection().getRangeAt(0).startContainer;
    if (selection.id != null && selection.id == parentId) return true;
    for (var index = 0; index < limit; index++) {
        selection = selection.parentNode;
        if (selection == null) return false;
        if (selection.id == parentId) {
            return true;
        }
    }
    return false;
}
// Indique si la sélection se trouve dans la base indiqué en paramètre (Ca peut être une balise parente éloigné).
// Si attr défini: Indique si la sélection se trouve dans la balise contenant l'attribut indiqué en paramètre.
// Si attr défini et value défini: Indique si la sélection se trouve dans la balise contenant l'attribut avec la valeur indiqué en paramètre.
// continueIfNotFound=true: Indique qu'il faut continuer à chercher si une balise correspondante est trouvé mais ne contient pas l'attribut ou la valeur recherché.
function IsInTag(tagName, attr = null, value = null, continueIfNotFound = false) {
    // Préparation des fonctions de vérification
    function tagFound(node, tagName) { return String(node.nodeName).toLowerCase() == String(tagName).toLowerCase(); }
    function attrFound(node, attr) { return node.hasAttribute(attr); }
    function attrValueFound(node, attr, value)
    { return node.hasAttribute(attr) && node.getAttribute(attr).valueOf() == value; }

    selection = document.getSelection();
    if (document.getSelection().rangeCount == 0) return false;
    node = selection.focusNode;
    for (var index = 0; index < 15; index++) {
        if (node.id == "JWE_inputContent") return null; // Arrêter la function si on atteint les limites de l'éditeur.
        if (tagFound(node, tagName)) {
            if (attr != null && attr != '' && !attrFound(node, attr)) {
                if (continueIfNotFound) continue;
                else return false;
            }
            if (attr != null && attr != '' && value != null && value != '' && !attrValueFound(node, attr, value)) {
                if (continueIfNotFound) continue;
                else return false;
            }
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

// Sélectionne tout le contenu de chaque noeud sélectionné
function selectAllContentOfSelectedNodes() {
    var selection = document.getSelection();
    var startContainer = selection.getRangeAt(0).startContainer;
    var endContainer = selection.getRangeAt(0).endContainer;
    var newRange = document.createRange();
    newRange.setStartBefore(startContainer);
    newRange.setEndAfter(endContainer);
    var winSelection = window.getSelection();
    winSelection.removeAllRanges();
    winSelection.addRange(newRange);
}

// Retourne un tableau contenant les noeuds sélectionné (A améliorer)
function getSelectedNodes() {
    var selectedNodes = []; // Tableau de noeud à retourner
    var selection = document.getSelection();
    var OwnerSelectedNodes = selection.getRangeAt(0).commonAncestorContainer; // Noeud contenant les noeuds de la sélection et autre.
    // Si OwnerSelectedNodes n'est pas l'éditeur: Récupérer le parent (Se faisant, ses éléments seront automatiquement récupéré...)
    if (OwnerSelectedNodes.id != 'JWE_inputContent') {
        selectedNodes.push(OwnerSelectedNodes);
        return selectedNodes; // Inutile de continuer étant donnée qu'on a récupéré tous les éléments recherché.
    }
    else {
        if (OwnerSelectedNodes.childNodes.length == 1) {
            selectedNodes.push(OwnerSelectedNodes.firstChild);
            return selectedNodes; // Inutile de continuer étant donnée qu'on a récupéré tous les éléments recherché.
        }
    }
    var firstSelectedNode = selection.getRangeAt(0).startContainer;
    var lastSelectedNode = selection.getRangeAt(0).endContainer;
    var firstIsReached = false; // Indique quand le premier noeud de la sélection est atteint
    var counter = 0;
    var nodeToCheck = OwnerSelectedNodes.childNodes[0];
    while (nodeToCheck) {
        if (nodeToCheck == firstSelectedNode || nodeToCheck.contains(firstSelectedNode)) {
            firstIsReached = true;
        }
        // Ajout du noeud au tableau si on a atteint les noeuds de la sélection
        if (firstIsReached) {
            selectedNodes.push(nodeToCheck);
        }
        // Arrêt de la boucle si on a vient d'ajouter le dernier noeud de la sélection dans le tableau
        if (nodeToCheck == lastSelectedNode || nodeToCheck.contains(lastSelectedNode)) {
            break;
        }
        // Préparation du noeud suivant
        counter++;
        nodeToCheck = OwnerSelectedNodes.childNodes[counter];
    }
    return selectedNodes;
}

// Créer une sélection à partir des noeuds indiqué en paramètre
function selectNode(start, end = null) {
    if (start == null) {
        alert('error: selection001');
        return;
    }
    var selection = document.getSelection();
    var newRange = document.createRange();
    if (end == null) newRange.selectNode(start);
    else {
        newRange.setStartBefore(start);
        newRange.setEndAfter(end);
    }
    selection.removeAllRanges();
    selection.addRange(newRange);
}

// Sélectionne le contenu du noeud indiqué en paramètre
function selectNodeContents(node) {
    var selection = document.getSelection();
    var newRange = document.createRange();
    newRange.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(newRange);
}

// Sélectionne l'objet Range indiqué en paramètre
function selectRange(range) {
    if (range == null) {
        alert('error: selection002');
        return;
    }
    var selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

// Supprime toutes les sélections
function RemoveAllSelection() {
    var s = document.getSelection();
    s.removeAllRanges();
}

// Récupère le premier noeud #text du noeud indiqué en paramètre
function getFirstTextNode(node) {
    if (node.nodeName == '#text') {
        return node;
    }
    else {
        var node = node.childNodes[0];
        return getFirstTextNode(node);
    }
}

// Récupère le dernier noeud #text du noeud indiqué en paramètre
function getlastTextNode(node) {
    if (node.nodeName == '#text') {
        return node;
    }
    else {
        var node = node.childNodes[node.childNodes.length-1];
        return getlastTextNode(node);
    }
}

// Créer un objet Range partir des données créé par la méthode prepareRangeFromOutsideNodeOfSelection()
function createRangeFromOutsideNodeOfSelection(data) {
    if (!data) {
        alert('error: selection003');
        return;
    }
    var range = document.createRange();
    var children = data.owner.childNodes;
    if (data.owner.childNodes.length == 1) {
        range.selectNodeContents(data.owner);
    }
    else if (data.owner.childNodes.length == 2) {
        range.setStartBefore(children[0]);
        range.setEndAfter(children[1]);
    }
    else if (data.owner.childNodes.length > 2) {
        if (data.isFirstInOwner) { // Le noeud est le premier enfant.
            range.setStart(getFirstTextNode(data.owner), 0);
        }
        else {
            range.setStartBefore(data.startAfter.nextSibling.firstChild);
        }
        if (data.isLast) { // Le noeud est le dernier enfant
            var lastTextNode = getlastTextNode(data.owner);
            range.setEnd(lastTextNode, lastTextNode.length);
        }
        else {
            var lastTextNode = getlastTextNode(data.endBefore.previousSibling);
            range.setEndAfter(data.endBefore.previousSibling.lastChild);
        }
    }
    else {
        // error
    }
    return range;
}

// Prépare des données pour créer un objet Range en se basant sur les noeuds englobant (avant et après) la sélection
// Utiliser les données reçu avec la méthode createRangeFromOutsideNodeOfSelection()
function prepareRangeFromOutsideNodeOfSelection() {
    var data = new Object();
    var nodesCache = getSelectedNodes(); // Récupère les éléments sélectionnés sous forme de tableau
    var startingNode = nodesCache[0]; // Contient le premier élément du tableau
    if (!startingNode?.parentNode) {
        alert('error: selection005');
        RemoveAllSelection();
        return false;
    }
    var ownerNodes = startingNode.parentNode;
    data.owner = ownerNodes;
    if (ownerNodes.childNodes.length > 0) {
        var endingNode = nodesCache[nodesCache.length-1]; // Contient le dernier élément du tableau
        var elementCache; // Contient l'élément précédement recherché dans la boucle
        // parcourir les noeuds enfants pour trouver le noeud "avant" et "après" la sélection
        for (let index = 0; index < ownerNodes.childNodes.length; index++) {
            var element = ownerNodes.childNodes[index];
            if (element == startingNode) {
                if (index == 0) { // Le noeud est le premier enfant.
                    data.isFirstInOwner = true;
                }
                else {
                    data.isFirstInOwner = false;
                    data.startAfter = elementCache;
                }
            }
            if (element == endingNode) {
                if (index == ownerNodes.childNodes.length-1) { // Le noeud est le dernier enfant
                    data.isLast = true;
                }
                else {
                    data.isLast = false;
                    data.endBefore = ownerNodes.childNodes[index+1];
                }
                break;
            }
            elementCache = element;
        }
    }
    else { // = 0
        // error
        return null;
    }
    return data;
}

// Function qui insert un conteneur P (ou autre) dans les balises li qui n'en contiennent pas
function AddTagInLI(ulNode, tag) {
    for (var index = 0; index < ulNode.childElementCount; index++) {
        var liNode = ulNode.childNodes[index];
        var liNodeContent = liNode.firstChild;
        if (String(liNodeContent.nodeName).toLowerCase() == String(tag).toLowerCase()) {
            continue;
        }
        var p = document.createElement(tag);
        p.append(liNodeContent);
        liNode.append(p);
    }
}

// Désactive les balises H[1-6] sélectionnés
function disableSelectedHeaders() {
    var rangeCache = prepareRangeFromOutsideNodeOfSelection();
    // Récupération des éléments de la sélection
    var elements = getSelectedNodes();
    // Parcourir tous les éléments à la recherche d'une balise H
    GetContainerNode()
    elements.forEach(element => {
        node = findNode(element, '^H[1-6]$');
        if (node != null) {
            selectNode(node);
            document.execCommand('formatBlock', false, 'p');
        }
    });
    selectRange(createRangeFromOutsideNodeOfSelection(rangeCache));
}

// Converti la sélection en une liste
function ConvertSelectionToUnorderedList() {
    // Préparation de la dernière sélection permettant de sélectionner la liste à la fin de cette méthode.
    var rangeData = prepareRangeFromOutsideNodeOfSelection()
    if (!rangeData) {
        return;
    }
    // Transformation des textes en liste
    document.execCommand("insertUnorderedList");
    // Récupération du conteneur de la liste
    var ulNode = document.getSelection().focusNode.parentNode.parentNode;
    ulNode = ulNode.nodeName == 'LI' ? ulNode.parentNode : ulNode;
    var parentOfListAndP = ulNode.parentNode.parentNode;
    var htmlOfUl = "";
    // Ajout du conteneur P dans les balises li qui n'en contiennent pas
    AddTagInLI(ulNode, 'p');
    // Sauvegarde du code html de la liste
    htmlOfUl = '<ul>'+ulNode.innerHTML+'</ul>';
    // Annuler la mise en place de la liste pour ensuite la réinsérer via inserHTML pour éviter les bugs quand on fait CTRL+Z.
    document.execCommand('undo');
    disableSelectedHeaders(); // Désactiver le mode "titre" de la sélection
    // Insertion de la liste à la place de la sélection
    deleteSpanOnInputCache = deleteSpanOnInput; // Sauvagarde de l'état
    deleteSpanOnInput = false; // Désactivation temporaire
    document.execCommand('insertHTML', false, htmlOfUl);
    deleteSpanOnInput = deleteSpanOnInputCache; // Réinsertion de l'état avant l'utilisation de cette méthode
    selectRange(createRangeFromOutsideNodeOfSelection(rangeData));
}

// Prépare une liste à être supprimé preprement
function prepareForDeleteUl(ulNode) {
    // START - Requis pour qu'il n'y ai pas de bug gênant après la suppréssion de la liste...
    var pTmp = document.createElement('p');
    pTmp.append(document.createElement('br'));
    ulNode.before(pTmp); // Indispensable pour pouvoir supprimer la liste d'un coup
    var selection = document.getSelection();
    var newRange = document.createRange();
    newRange.setStartBefore(pTmp);
    newRange.setEndAfter(ulNode);
    selection.removeAllRanges();
    selection.addRange(newRange);
    var pTmp = document.createElement('p');
    pTmp.append(document.createElement('br'));
    ulNode.after(pTmp); // Indispensable pour garder l'espace entre le texte de la liste et les éléments suivants. Empêche aussi l'apparition de SPAN.
    // END - Requis pour qu'il n'y ai pas de bug gênant après la suppréssion de la liste...
    // Code pour supprimer: document.execCommand("forwardDelete");
}

// Désactive proprement une liste
function disableListUl(ulNode, deleteList = false) {
    // Préparation de la dernière sélection permettant de (re)sélectionner le texte à la fin de cette méthode.
    var rangeData = prepareRangeFromOutsideNodeOfSelection();
    if (ulNode.nodeName != 'UL') {
        alert('error: liste001'); // Ne rien faire si ce n'est pas une liste
        RemoveAllSelection();
        return;
    }
    // Sélectionner toute la liste
    selectNode(ulNode);
    // Préparation du code html regroupant les balises P
    htmlOfUl = '';
    // Insérer le code HTML dans htmlOfUl
    ulNode.childNodes.forEach(element => {
        htmlOfUl += element.innerHTML;
    });
    // Requis pour qu'il n'y ai pas de bug gênant après la suppréssion de la liste...
    prepareForDeleteUl(ulNode);
    // Insertion des éléments P à la place de la liste
    deleteSpanOnInputCache = deleteSpanOnInput; // Sauvagarde de l'état
    deleteSpanOnInput = false; // Désactivation temporaire
    if (!deleteList) document.execCommand('insertHTML', false, htmlOfUl);
    deleteSpanOnInput = deleteSpanOnInputCache; // Réinsertion de l'état avant l'utilisation de cette méthode
    selectRange(createRangeFromOutsideNodeOfSelection(rangeData));
}


function insertTagOnSelection(name, param = null){

    var selection = document.getSelection();
    var IsEditorSelection = parentIdOfSelectionExists("JWE_inputContent", 10);


    if (!IsEditorSelection) alert("Vous devez sélectionner le texte dans l'éditeur.");

    switch(name){
        case "bold":
            document.execCommand("bold");
            break;
        case "italic":
            document.execCommand("italic");
            break;
        case "underline":
            document.execCommand("underline");
            break;
        case "important":
            document.execCommand("insertText", false, switchTag("!", selection));
            break;
        case "strike":
            document.execCommand("strikeThrough");
            break;
        case "list":
            deleteSpanOnInput = false; // Désactivation temporaire
        
            var IsOnlyList; // Indique si la sélection contient seulement la liste
            var isSelectedList = false; // Indique si une liste ou ses éléments, sont sélectionnés.
            var nodesCache = getSelectedNodes(); // Récupère les éléments sélectionnés sous forme de tableau
            if (nodesCache.length > 0) {
                nodesCache.forEach(element => {
                    if (!GetListNode(element)) {
                        IsOnlyList = false;
                    }
                    else {
                        if (IsOnlyList == null) IsOnlyList = true;
                        isSelectedList = true;
                    }
                });
            }
            else {
                alert(nodesCache.length);
                // error
                return;
            }
            
            // List to text
            // Si on veut de transformer une liste en texte
            if (IsOnlyList) { // Transformer les éléments de liste Li en P
                // Récupération du conteneur de la liste
                var ulNode = GetListNode(selection.focusNode) ?? nodesCache[0];
                // Pour corriger le bug : addRange(): The given range isn't in document. (C'est en attendant que je développe une solution pour retirer juste une ligne appartenant à une liste.)
                var rfl = document.createRange();
                rfl.selectNodeContents(ulNode);
                selectRange(rfl);
                // Désactivation de la liste
                disableListUl(ulNode);
            }
            // Text to list && Text+list to list
            else {       
                // Récupération du conteneur de la liste
                var ulNode = document.getSelection().focusNode.parentNode.parentNode;
                ulNode = ulNode.nodeName == 'LI' ? ulNode.parentNode : ulNode;      
                // Text to list
                // Si une nouvelle liste vient d'être ajouté : Elle a été placé dans une balise P et il faut corriger celà
                if (!isSelectedList) {
                    ConvertSelectionToUnorderedList();
                }
                // Text+list to list
                // Si une liste était déjà présente, mais qu'on veut rajouter des éléments.
                else {
                    // Désactiver les headers...
                    disableSelectedHeaders();
                    // Récupérer les éléments de la sélection
                    var nodes = nodesCache;
                    // Désactiver toutes les listes présentes dans la sélection avec la méthode disableListUl()
                    nodes.forEach(element => {
                        if (element.nodeName == 'UL') {
                            disableListUl(element);
                        }
                    });
                    // Convertir le contenu en liste avec la méthode ConvertSelectionToUnorderedList()
                    ConvertSelectionToUnorderedList();
                }
            }
            deleteSpanOnInput = true; // Réactivation
            break;
        case "color":
            document.execCommand("foreColor", false, param);
            break;
        case "decreaseFontSize":
            if (IsInTag('font', 'size', '3')) {
                document.execCommand("removeFormat");
            }
            else {
                document.execCommand("fontSize", false, "3");
            }
            break;
        case "link":
            if (IsInTag('a')) {
                document.execCommand("unlink");
            }
            else {
                argument = prompt("Ecrivez l'adresse du lien :");
                if (argument != null) document.execCommand("createLink", false, argument);
            }
            break;
        case "title":
            if (String(param).match(/^h[1-6]$/i)) {
                document.execCommand("formatBlock", false, '<'+param+'>');
            }
            else {
                disableSelectedHeaders();
            }
            break;
        case "align":
            switch (param) {
                case 'left':
                    document.execCommand("justifyLeft");
                    break;
                case 'center':
                    document.execCommand("justifyCenter");
                    break;
                case 'right':
                    document.execCommand("justifyRight");
                    break;
                case 'full':
                    document.execCommand("justifyFull");
                    document.execCommand("styleWithCSS", false, false);
                    break;
            }
            break;
        case "image":
            argument = prompt("Ecrivez l'adresse du lien :");
            if (argument == null || argument == '') return; // Ne rien faire si l'adresse de l'image n'est pas renseigné.

            var dTmp = document.createElement('div');
            var p = document.createElement('p');
            var img = document.createElement('img');
            img.src = argument;
            img.style = " margin: 5px 0px 10px 0px; max-width: 100%;";
            p.append(img);
            var pAfterP = document.createElement('p'); // Pour pouvoir sélectionner/insérer du texte après l'image quand elle se trouve en dernière position.
            pAfterP.append(document.createElement('br'));
            dTmp.append(p);
            dTmp.append(pAfterP);
            document.execCommand('insertHTML', false, dTmp.innerHTML);
            break;
        case "leftImage":
            var containerNode = GetContainerNode();
            if (containerNode == null) return; // Ne rien faire si le noeud du conteneur n'est pas trouvé.
            
            argument = prompt("Ecrivez l'adresse du lien :");
            if (argument == null || argument == '') return; // Ne rien faire si l'adresse de l'image n'est pas renseigné.

            var dTmp = document.createElement('div');
            var p = document.createElement('p');
            var img = document.createElement('img');
            img.src = argument;
            img.style = "float: left; margin: 5px 10px 10px 0px; max-width: 50%;";
            p.append(img);
            dTmp.append(p);
            dTmp.append(containerNode.cloneNode(true));
            selectNode(containerNode);
            document.execCommand('insertHTML', false, dTmp.innerHTML);

            break;
    }
}