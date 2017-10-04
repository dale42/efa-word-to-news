$(document).foundation();

const fileWidget = document.querySelector('#file-widget');
const htmlCodeContainer = document.querySelector('#html-code');
const htmlDisplayContainer = document.querySelector('#html-display');

fileWidget.addEventListener('change', function (event) {
  if (event.target.files[0] !== null) {
    loadFile(event.target.files[0]);
  }
});

/*
 * Loading as a binary file then working out the character-set would technically
 * be the most elegant solution. However, according to the docs, read as binary
 * is not recommended for production and there are no libraries to manage all of
 * intricacies of handling multibyte characters sets from binary. For simplicity,
 * Windows 1252 is assumed on initial read. If validation of Windows 1252 can't
 * be determined from the header, the file is reloaded as UTF-8 as a fallback.
 * For the purposes of this application, that's good enough. If another character
 * encoding is required it can be added.
 */


function loadFile(file, charSet = 'windows-1252') {
  const fileReader = new FileReader;
  fileReader.onload = readFile.bind(null, charSet, file);
  fileReader.readAsText(file, charSet);
}


function readFile(charSet, file, readEvent) {
  const isWindows1252 = readEvent.target.result.match(/<head[\s\S]*>[\s\S]*<meta.*?charset=windows-1252.*?>/im);

  if (charSet === 'windows-1252' && isWindows1252) {
    processHtml(readEvent);
  } else if (charSet === 'UTF-8') {
    processHtml(readEvent);
  } else {
    loadFile(file, 'UTF-8');
  }
}


function processHtml(readEvent) {
  const resultsContainer = document.querySelector('#results-container');
  const messageContainer = document.querySelector('#message-container');
  const messageArea      = document.querySelector('#message-area');
  const instructions     = document.querySelector('#instructions');

  instructions.classList.add('hide');
  resultsContainer.classList.remove('open');
  messageContainer.classList.remove('display');

  const bodyHtml = /<body.*?>([\s\S]*)<\/body>/gmi.exec(readEvent.target.result);
  if (bodyHtml === null) {
    messageArea.innerText = 'The content of this file is not a HTML document or not in an understood format';
    messageContainer.classList.add('display');
    return;
  }
  htmlDisplayContainer.innerHTML = bodyHtml[1];
  clean(htmlDisplayContainer);
  let htmlAsText = htmlDisplayContainer.innerHTML.trim();
  htmlAsText = htmlAsText.replace(/\n{2,}/gm, '\n\n');
  htmlCodeContainer.innerText = htmlAsText;
  resultsContainer.classList.add('open');
}


function clean(domNode) {
  const nodeName = domNode.nodeName.toLowerCase();

  if (['table', 'o:p'].indexOf(nodeName) > -1) {
    domNode.parentNode.removeChild(domNode);

  } else if (['div', 'span'].indexOf(nodeName) > -1) {
    // Move children nodes to parent and delete this node
    const parentNode = domNode.parentNode;

    if (domNode.hasChildNodes()) {
      if (domNode.id === 'html-display') {
        domNode.childNodes.forEach(childNode => clean(childNode));
      }
      else {
        domNode.childNodes.forEach(childNode => {
          let cloneChild = childNode.cloneNode(true);
          parentNode.insertBefore(cloneChild, domNode);
          clean(cloneChild);
        });
        domNode.remove();
      }
    }

  } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'b', 'a', 'em'].indexOf(nodeName) > -1) {
    // Retain the tag (but clean it up) and run clean() on children
    domNode.removeAttribute('class');
    domNode.removeAttribute('style');

    if (domNode.hasChildNodes()) {
      domNode.childNodes.forEach(childNode => clean(childNode));
    }

    // Now that the childnodes have been processed, make sure the node still
    // has content. Delete it if it doesn't.
    if (domNode.innerText.trim().length === 0) {
      domNode.remove();
    }

  } else if (nodeName === '#text') {
    domNode.nodeValue = domNode.nodeValue.replace(/ *$/g, '');
  }

}
