const yo = require('yo-yo')
const cuid = require('cuid')

const blocks = [
  {
    "id": "free-content",
    "name": "Free content",
    "fields": [
      { "id": "content", "label": "Content", "type": "markdown" }
    ]
  },
  {
    "id": "place",
    "name": "Place",
    "fields": [
      { "id": "title", "label": "Title", "type": "text" },
      { "id": "pictures", "label": "Pictures", "type": "text" },
      { "id": "desc", "label": "Description", "type": "textarea" },
      { "id": "type", "label": "Type of place", "type": "select", "data": ['large', 'small', 'medium'] }
    ]
  }
]
  
// const blocksToDisplay = ['free-content', 'place', 'place', 'free-content']
let state = {
  blocks: []
}
window.state = state

var savedState = localStorage.getItem('tentState')
if ( savedState ) {
  state = JSON.parse(savedState)
}

const el = render(state)
document.body.appendChild(el)

function update () {
  console.log('update!')
  console.log(JSON.stringify(state))
  localStorage.setItem('tentState', JSON.stringify(state))
  yo.update(el, render(state))
}

function addNewBlock (type) {
  var blockTemplate = blocks.find(block => {
    return block.id === type
  })
  var newBlock = Object.assign({}, blockTemplate, { uniqueID: cuid() })
  newBlock.fields.forEach(field => {
    field.uniqueID = cuid()
  })
  state.blocks.push(newBlock)
  console.log(newBlock)
  update()
}
  
function render (state) {  
  return yo`
    <span>
      <button onclick=${ev => addNewBlock(document.getElementById('blockType').value)}>
        add block
      </button>
      <select id="blockType">
        ${blocks.map(item => {
          return yo`<option>${item.id}</option>`
        })}
      </select>
      <form onsubmit=${ev => ev.preventDefault()}>
        ${state.blocks.map(block => {
          return yo`<div class="block">
              <h3>${block.name}</h3>
  			  ${block.fields.map((field) => {
                return fieldEl(field, block)
              })}
          </div>`
        })}
      </form>
    </span>
  `
}

function saveField (block, field, newValue) {
  field.value = newValue
  console.log(state)
  update()
}
  
function fieldEl (field, block) {
  switch (field.type) {
    case 'text':
      return yo`
  		<fieldgroup>
          <label>${field.label}</label>
  		  <input type="text" name="${field.uniqueID}" placeholder="${field.label}" value="${field.value || ''}" onkeyup=${ev => saveField(block, field, ev.target.value)}>
        </fieldgroup>
  		`
    case 'textarea':
      return yo`
        <fieldgroup>
          <label>${field.label}</label>
          <textarea name="${field.id}" onkeyup=${ev => saveField(block, field, ev.target.value)}>${field.value || ''}</textarea>
        </fieldgroup>
      `
    case 'markdown':
      return yo`
        <fieldgroup>
          <label>${field.label}</label>
          <textarea name="${field.id}" onkeyup=${ev => saveField(block, field, ev.target.value)}>${field.value || ''}</textarea>
        </fieldgroup>
      `
    case 'select':
      return yo`
        <fieldgroup>
          <select onchange=${ev => saveField(block, field, ev.target.value)}>
           ${field.data.map((item) => {
             return yo`<option selected="${field.value === item ? 'true' : false}">${item}</option>`
           })}
          </select>
        </fieldgroup>
      `
    default:
      return yo`
        <fieldgroup>
          <input name="${field.id}" placeholder="${field.label}">
        </fieldgroup>
      `
  }
}
