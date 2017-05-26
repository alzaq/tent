const { h, app } = require('hyperapp')
const hyperx = require('hyperx')
const html = hyperx(h)
const css = require('template-css')

const styles = css`
  .simpleEditor-body {
    border: 0;
    border-right: 1px solid black;
    margin-bottom: 20px;
    width: 100%;
    height: 100%;
    font-size: 16px;
    line-height: 1.7;
    padding: 7px 15px;
  }

  .simpleEditor-body:focus {
    outline: none;
  }
`

module.exports = simpleEditor

function simpleEditor (doc, oncreate, onchange) {
  return html`<textarea class="simpleEditor-body"
                        oncreate=${oncreate}
                        oninput=${onchange}>${doc}</textarea>`
  // doc = doc || ''
  // onchange = onchange || function () {}
  //
  // function render (content) {
  //   return html`<div style="height: 100%;">
  //     <textarea class="simpleEditor-body" oninput=${updateBody}>${content}</textarea>
  //   </div>`
  //
  //   function updateBody (e) {
  //     doc = e.target.value
  //     onchange(doc)
  //   }
  // }
  //
  // return render
}
