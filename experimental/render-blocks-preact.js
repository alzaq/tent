const preact = require('preact')
const h = preact.h
// const cuid = require('cuid')

const blockTypes = {
  "free-content": {
    "fields": [
      { "id": "content", "label": "Content", "type": "markdown" }
    ]
  },
  "place": {
    "fields": [
      { "id": "title", "label": "Title", "type": "text" },
      { "id": "pictures", "label": "Pictures", "type": "text" },
      { "id": "desc", "label": "Description", "type": "textarea" },
      { "id": "type", "label": "Type of place", "type": "select", "data": ['large', 'small', 'medium'] }
    ]
  }
}

class FieldAdmin extends preact.Component {
    constructor() {
      super()
      this.state = {
        blocks: []
      }
      this.blocks = []
	}
  
    componentDidMount () {
      this.loadState()
	}
  
    loadState () {
      var savedState = localStorage.getItem('tentState')
      if ( savedState ) {
        this.blocks = JSON.parse(savedState)
        console.log(this.blocks)
        this.setState({ blocks: this.blocks })
      }
    }
  
    saveState () {
      console.log(this.blocks)
      const blocks = JSON.stringify(this.blocks)
      localStorage.setItem('tentState', blocks)
    }
  
    update () {
      console.log('update!')
      this.setState({ blocks: this.blocks })
      this.saveState()
    }
  
    addNewBlock (type) {
      // const newBlock = Object.assign({}, blockTypes[type].fields, { id: type })
      const newFields = blockTypes[type].fields.slice(0).map(field => {
        return { id: field.id, value: field.value }
      })
      const newBlock = {
        fields: newFields,
        id: type
      }
      this.blocks.push(newBlock)
      console.log(newBlock)
      this.update()
    }
  
    saveField (block, field, newValue) {
      field.value = newValue
      this.update()
    }
  
    fieldEl (field, block) {
      const fieldSchema = blockTypes[block.id].fields.find(fieldSchemaItem => {
        return fieldSchemaItem.id === field.id
      })
      console.log('schema', fieldSchema)
      switch (fieldSchema.type) {
        case 'text':
          return (
            <fieldgroup>
              <label>{fieldSchema.label}</label>
              <input type="text" name={field.id} placeholder={fieldSchema.label} value={field.value || ''} onChange={ev => this.saveField(block, field, ev.target.value)} />
            </fieldgroup>
          )
        case 'textarea':
          return (
            <fieldgroup>
              <label>{fieldSchema.label}</label>
              <textarea name={field.id} onkeyup={ev => this.saveField(block, field, ev.target.value)}>{field.value || ''}</textarea>
            </fieldgroup>
          )
        case 'markdown':
           return (
            <fieldgroup>
              <label>{fieldSchema.label}</label>
              <textarea name="{field.id}" onkeyup={ev => this.saveField(block, field, ev.target.value)}>{field.value || ''}</textarea>
            </fieldgroup>
           )
        case 'select':
          return (
            <fieldgroup>
              <select value={field.value} onchange={ev => this.saveField(block, field, ev.target.value)}>
                {fieldSchema.data.map((item) => {
                  return <option value={item}>{item}</option>
                })}
              </select>
            </fieldgroup>
          )
        default:
          return (
            <fieldgroup>
              <input name={field.id} placeholder={field.label} />
            </fieldgroup>
          )
      }
    }

	render (props, state) {
		return (
          <div>
            <button onclick={ev => this.addNewBlock(document.getElementById('blockType').value)}>
              add block
            </button>
            <select id="blockType">
              {Object.keys(blockTypes).map(type => {
                return <option>{type}</option>
              })}
            </select>
            <form onsubmit={ev => ev.preventDefault()}>
              {state.blocks.map(block => {
                return <div class="block">
                  <h3>{block.id}</h3>
                  {block.fields.map((field) => {
                    return this.fieldEl(field, block)
                   })}
                </div>
              })}
            </form>
          </div>
        )
	}
}

preact.render(<FieldAdmin />, document.body)