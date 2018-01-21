const Editor = require('./simple-editor')
const Preview = require('./markdown-preview')
const dragDrop = require('drag-drop')
const api = require('./client-api.js')
const debounce = require('lodash.debounce')
const css = require('template-css')

const { h, app } = require('hyperapp')
const hyperx = require('hyperx')
const html = hyperx(h)

// TODO: encryption
// https://www.webpackbin.com/bins/-Kf39BfshtwP3rIZVuEV

function log (msg) {
  if (typeof msg === 'object') {
    try {
      msg = JSON.stringify(msg)
    } catch (e) {
      msg = msg
    }
  }

  function pad (str) {
    return (str.length !== 2) ? '0' + str : str
  }

  var date = new Date()
  var hours = date.getHours().toString()
  var minutes = date.getMinutes().toString()
  var seconds = date.getSeconds().toString()
  var time = pad(hours) + ':' + pad(minutes) + ':' + pad(seconds)

  // const resultingMessage = `%c [${time}] ✨ ${msg}`
  // console.log(resultingMessage, 'color: #5e2ca5;')
  var resultingMessage = `[${time}] 🚦 ${msg}`
  console.log(resultingMessage)
}

function insertAtCaret (el, text) {
  const startPos = el.selectionStart
  const endPos = el.selectionEnd
  el.value = el.value.substring(0, startPos) + text + el.value.substring(endPos, el.value.length)
  el.selectionStart = startPos + text.length
  el.selectionEnd = startPos + text.length
  el.focus()
  el.dispatchEvent(new Event('input'))
}

const styles = css`
  html {
    box-sizing: border-box;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }

  body, html {
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont,
           'avenir next', avenir,
           helvetica, 'helvetica neue',
           ubuntu,
           roboto, noto,
           'segoe ui', arial,
           sans-serif;
  }

  button {
    background: none;
    border: 0;
    font-family: inherit;
    font-size: inherit;
  }

  .tent-newDoc {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    border: 1px solid #b9b9b9;
    border-radius: 3px;
    background-color: white;
    z-index: 10;
  }

  .tent-newDoc.is-visible {
    display: block;
  }

  .tent-main {
    display: flex;
    justify-content: center;
    height: 100vh;
    overflow: hidden;
  }

  .tent-list {
    width: 150px;
    height: 100vh;
    list-style: none;
    padding: 0;
    margin: 0;
    border-right: 1px solid black;
    overflow-y: auto;
  }

  .tent-list li {
    margin: 0;
    padding: 0;
  }

  .tent-list li:hover button,
  .active button {
    background: black;
    color: white;
  }

  .tent-list button {
    cursor: pointer;
    padding: 10px 6px;
    border-bottom: 1px solid black;
    width: 100%;
    text-align: left;
    outline: none;
    font-size: 12px;
    border-radius: 0;
  }

  .tent-panels {
    flex: 1;
  }

  .tent-editor {
    flex: 1;
    height: 100vh;
  }

  .tent-preview {
    flex: 1;
    height: 100vh;
    overflow-y: auto;
  }
`

let editorEl

const state = {
  doc: '',
  docId: '',
  docList: [],
  showNewDocPopOver: false
}

const events = {
  loaded: (state, actions) => {
    log('Start like an animal!')

    window.onbeforeunload = (ev) => actions.saveState()

    actions.loadDocList()
      .then(actions.loadLastOpenDoc)
      .catch((err) => console.log(err))

    dragDrop(document.body, function (files) {
      files.forEach(function (file) {
        actions.saveFile(file)
      })
    })
  }
}

const actions = {
  updateDocList: (state, actions, data, emit) => {
    return { docList: data }
  },
  updateDoc: (state, actions, data, emit) => {
    return { doc: data.doc, docId: data.docId }
  },
  toggleNewDocPopover: (state, actions, data, emit) => {
    return { showNewDocPopOver: data }
  },
  saveFile: (state, actions, data, emit) => {
    log('Saving file')
    api.saveFile(data, (err, res) => {
      if (err) console.log(err)
      console.log(res.data)
      const type = res.data.type.split('/')[0]

      let insertContent
      if (type === 'image') {
        insertContent = `![](${res.data.url})`
      } else {
        insertContent = res.data.url
      }

      insertAtCaret(editorEl, insertContent)
    })
  },
  loadDocList: (state, actions, data, emit) => {
    return new Promise((resolve, reject) => {
      api.getList((err, res) => {
        if (err) reject(err)
        log('Loaded doc list')
        actions.updateDocList(res.data)
        return resolve(res.data)
      })
    })
  },
  loadDoc: (state, actions, data, emit) => {
    const docId = data || state.docList[0]
    return new Promise((resolve, reject) => {
      api.getDoc(docId, (err, res) => {
        if (err) reject(err)
        log('Loaded doc: ' + docId)
        actions.updateDoc({ doc: res.data, docId: docId })
        editorEl.value = res.data
        resolve(res)
      })
    })
  },
  saveDoc: (state, actions, data, emit) => {
    log('Saving: ' + data.docId)
    return new Promise(function (resolve, reject) {
      api.saveDoc(data.docId, data.doc, (err, res) => {
        if (err) reject(err)
        console.log(res)
        log(res)
        resolve(res)
      })
    })
  },
  newDoc: (state, actions, data, emit) => {
    const docId = data
    log('Creating new doc: ' + docId)

    return actions.saveDoc({ docId: docId, doc: '' })
      .then(actions.loadDocList)
      .then(() => actions.loadDoc(docId))
      .then(() => actions.toggleNewDocPopover(false))
      .catch((err) => console.log(err))
  },
  saveState: (state, actions, data, emit) => {
    localStorage.setItem('tentState', JSON.stringify(state))
  },
  loadLastOpenDoc: (state, actions, data, emit) => {
    const savedStateString = localStorage.getItem('tentState')
    const savedState = JSON.parse(savedStateString)
    let docId
    if (savedState && savedState.docId) {
      log('Found some saved state: ' + savedStateString)
      docId = savedState.docId
    }
    return actions.loadDoc(docId)
      .then(actions.updateEditor)
      .catch((err) => console.log(err))
  }
}

const _saveDoc = debounce((data, actions) => actions.saveDoc(data), 1000)

function view (state, actions) {
  let newDocName = ''

  function onEditorChange (ev) {
    const data = {docId: state.docId, doc: ev.target.value}
    actions.updateDoc(data)
    _saveDoc(data, actions)
  }

  function onEditorCreate (el) {
    editorEl = el
  }

  return html`
    <main class="tent-main">
      <div class="tent-newDoc ${state.showNewDocPopOver ? 'is-visible' : ''}">
        <h4>Create new document</h4>
        <input type="text" placeholder="path/name" onchange=${(ev) => newDocName = ev.target.value}/>
        <button onclick=${() => actions.newDoc(newDocName)}>create</button>
      </div>

      <ul class="tent-list">
        <li><button onclick=${() => actions.toggleNewDocPopover(true)}>+ new</button></li>
        ${state.docList.map((docId) => {
          return html`<li class="${state.docId === docId ? 'active' : ''}">
            <button onclick=${(ev) => actions.loadDoc(docId)}>${docId}</button>
          </li>`
        })}
      </ul>

      <div class="tent-editor">
        ${Editor(state.doc, onEditorCreate, onEditorChange)}
      </div>

      <div class="tent-preview">
        ${Preview(state.doc, { parseFrontmatter: true } )}
      </div>
    </main>
  `
}

const myApp = app({
  state: state,
  view: view,
  actions: actions,
  events: events
})
