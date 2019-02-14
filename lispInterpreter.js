let fs = require('fs')
fs.readFile('./inputFile.scm', 'utf-8', function (err, data) {
  if (err) return console.log(err)
  // data = data.replace('[', ' [ ').replace(']', ' ] ').replace('(', ' ( ').replace(')', ' ) ')
  console.log('main data', data)
  console.log('final', expressionParser(data.toString()))
})

let env = {
    '+' : (args) => { return args.reduce((a,b) => a * 1 + b * 1) },
    '-' : (args) => { return args.reduce((a,b) => a  * 1 - b * 1) },
    '*' : (args) => { return args.reduce((a,b) => (a * 1) * (b * 1)) },
    '/' : (args) => { return args.reduce((a,b) => a * 1 / b * 1) },
    '>' : (args) => { return args.reduce((a,b) => a * 1 > b * 1) },
    '<' : (args) => { return args.reduce((a,b) => a * 1 < b * 1) },
    '>=' : (args) => { return args.reduce((a,b) => a * 1 >= b * 1) },
    '<=' : (args) => { return args.reduce((a,b) => a * 1 <= b * 1) },
    '=' : (args) => { return args.reduce((a,b) => a * 1 === b * 1) },
    

}
// let props = Object.keys(env)

let numberParser = (input, num, regEx = /^(-?(0|[1-9]\d*))(\.\d+)?(((e)(\+|-)?)\d+)?/ig) => (num = input.match(regEx)) ? [num[0] * 1, input.slice(num[0].length)] : null

let symbolParser = input => {
  let remaining = ''
  let actual = ''
  if (!input.startsWith("'")) return null
  let inputRaw = input.substr(1)
  for (let i = 1; i < inputRaw.length; i++) {
    if (inputRaw.charAt(i) === "'" && inputRaw.charAt(i - 1) !== '\\') {
      actual = inputRaw.slice(0, i + 1).slice(0, -1)
      remaining = inputRaw.slice((i + 1))
      break
    }
    if (/\\/.test(inputRaw.charAt(i)) && /\\/.test(inputRaw.charAt(i - 1)) && /'/.test(inputRaw.charAt(i + 1))) {
      if (inputRaw.charAt(i - 2) === '\\') continue
      actual = "\\'"
      remaining = inputRaw.slice(i + 2)
      break
    }
  }
  if (/\\\\'/.test(actual)) return [actual, remaining]
  if (inputRaw.charAt(0) === '"') {
    actual = ''
    remaining = inputRaw.slice(1)
    return [actual, remaining]
  }
  for (let i = 1; i < actual.length; i++) {
    if (actual.charAt(i) === '\\') {
      let slashCheck = (actual.charAt(i + 1) === "'") || actual.charAt(i + 1) === '\\' || actual.charAt(i + 1) === '/' ||
      actual.charAt(i + 1) === 'b' || actual.charAt(i + 1) === 'f' || actual.charAt(i + 1) === 'n' ||
      actual.charAt(i + 1) === 'n' || actual.charAt(i + 1) === 'r' || actual.charAt(i + 1) === 't' || actual.charAt(i + 1) === 'u'
      if (slashCheck === false) return null
      if (actual.charAt(i + 1) === 'u') {
        let hexCheck = actual.slice(i + 1, i + 6)
        for (let i = 0; i < hexCheck.length; i++) {
          if (/u(\d|[A-F]){4}/i.test(hexCheck) !== true) return null
        }
      }
    }
  }
  return [actual, remaining]
}

let curlyParser = input => {
  if (!input.startsWith('(')) return null
  input = input.substr(1).slice(0, -1)
  let returnArray = []
  if(input.includes('define')) {
    console.log('yes')
    input = input.trim()
    let id = idParser(input.slice(0, -1))
    return id
  }
  input = input.trim()
  returnArray = input.split(' ')
  return [returnArray]
}

let factoryParser = function (...parsers) {
  return input => {
    let spaceCheck
    input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
    for (let parser of parsers) {
      let result = parser(input)
      if (result !== null) return result
    }
    return null
  }
}

typeParser = factoryParser(numberParser, symbolParser, curlyParser)

let spaceParser = input => input.match(/^[\n*\s\n*]/) ? [null, input.slice(input.match(/\S/).index)] : null
let commaParser = input => input.startsWith(',') ? [null, input.slice(1)] : null

let expressionParser  = (input) => {
  console.log("inp", input)
  // go on parsing till you find an identifier 
  input = input.replace(/\(/g , '( ').replace(/\)/g, ' )')
  console.log('replaced input', input)
  let id = [], res = [], k = 0, key
  for(let i = input.length - 1; i >= 0; i--)
  {
      if(input[i] === '('){
        let parsePass = typeParser(input.slice(i))
        console.log('pass', parsePass)
        console.log('type', typeof(parsePass[0]))
        if (parsePass === null) return null
        id = parsePass[0]
        console.log('id', id)
        for(let j in env) {
            if (env.hasOwnProperty(id[0])) {
              console.log('yes')
              console.log(id[0])
              key = id[0]
              id = id.splice(1)
              console.log('spliced', id)
             if(id[id.length - 1] === ')') { 
                console.log('yes2')
                id.splice(-1)
                console.log('id2', id)
              }
              console.log('id', typeof(id))
              console.log('idlength', id.length)
              if(id.length > 0 ) {
              console.log('yes3')
              res[k++] = env[key](id)
              console.log('res', res)
              }
            }
          }
      input = input.slice(0, i)
      console.log('newinp', input) 
      }
   }
   let result
   res = res.reverse()
   result = env[key](res)
   return result
  
}

let idParser = (input) => {
  let inputArray = input.split(' ')
  console.log('inputArray', inputArray)
  let value = inputArray.splice(2)
  console.log('value', value)
  env[`${inputArray[1]}`] = ''
  console.log('env', env)
  return value
  
}

