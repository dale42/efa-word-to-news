$(document).foundation();

const fileWidget = document.querySelector('#file-widget');
const iFrame = document.querySelector('iframe#input-iframe');
const htmlCodeContainer = document.querySelector('#html-code');
const htmlDisplayContainer = document.querySelector('#html-display');

fileWidget.addEventListener('change', function (event) {
  if (event.target.files[0] !== null) {
    const fileReader = new FileReader;
    fileReader.onload = loadHtml;
    fileReader.readAsText(event.target.files[0]);
  }
});


function loadHtml(readEvent) {
  console.log('- LOAD HTML');
  const bodyHtml = /<body.*?>([\s\S]*)<\/body>/gmi.exec(readEvent.target.result);
  if (bodyHtml === null) {
    // ToDo: display an error message
    console.log('BODY TEXT NOT FOUND');
    return;
  }
  htmlDisplayContainer.innerHTML = bodyHtml[1];
  clean(htmlDisplayContainer);
  let htmlAsText = htmlDisplayContainer.innerHTML.trim();
  htmlAsText = htmlAsText.replace(/\n{2,}/gm, '\n\n');
  htmlCodeContainer.innerText = htmlAsText;
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
