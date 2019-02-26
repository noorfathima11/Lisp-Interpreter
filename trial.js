let fs = require('fs')
fs.readFile('./inputFile.scm', 'utf-8', function (err, data) {
  if (err) return console.log(err)
  // data = data.replace('[', ' [ ').replace(']', ' ] ').replace('(', ' ( ').replace(')', ' ) ')
  console.log('main data', data)
  let evaluated = evaluator(data.toString())
  console.log('final', evaluated)
})

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

let env = {
  '+': (args) => { return args.reduce((a, b) => a * 1 + b * 1) },
  '-': (args) => { return args.reduce((a, b) => a * 1 - b * 1) },
  '*': (args) => { return args.reduce((a, b) => (a * 1) * (b * 1)) },
  '/': (args) => { return args.reduce((a, b) => a * 1 / b * 1) },
  '>': (args) => { return args.reduce((a, b) => a * 1 > b * 1) },
  '<': (args) => { return args.reduce((a, b) => a * 1 < b * 1) },
  '>=': (args) => { return args.reduce((a, b) => a * 1 >= b * 1) },
  '<=': (args) => { return args.reduce((a, b) => a * 1 <= b * 1) },
  '===': (args) => { return args.reduce((a, b) => a * 1 === b * 1) }
}
let props = Object.keys(env)
let condProps = ['>', '<', '>=', '<=', '===']

// Block of parsers -----------------------------------------------------------------------------------------------------------------------------------------------------
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

let identifierParser = (inputArray) => {
  console.log('identifierInput', inputArray)
  if (inputArray[0] === 'define') {
    return definitionInterpreter(inputArray)
  }
  if (inputArray[0] === 'if') {
    return conditionalInterpreter(inputArray)
  }
  return arithmeticEvaluator(inputArray)
}

let conditionalInterpreter = (inputArray) => {
  console.log('conditional input', inputArray)
  inputArray = inputArray.slice(1)
  console.log('inputArray in cond', inputArray)
  let cond = simpleExpression(inputArray)
  console.log('simple cond received', cond)
  if (cond === 'not simple') {
    cond = nestedExpression(inputArray)
    console.log('nested cond received', cond)
  }
  let conseq = simpleExpression(inputArray.slice(cond.length))
  console.log('simple conseq received', conseq)
  if (conseq === 'not simple') {
    conseq = nestedExpression(inputArray.slice(cond.length))
    console.log('nested conseq received', conseq)
  }
  let alt = simpleExpression(inputArray.slice(cond.length + conseq.length))
  console.log('simple alt received', alt)
  if (alt === 'not simple') {
    alt = nestedExpression(inputArray.slice(cond.length + conseq.length))
    console.log('nested alt received', alt)
  }
  let isCond = arithmeticEvaluator(cond.slice(1, cond.length - 1))
  console.log('isCond', isCond)
  if (isCond[0]) {
    let isConseq = arithmeticEvaluator(conseq.slice(1, conseq.length - 1))
    console.log('isConseq', isConseq)
    return [isConseq, '']
  }
  let isalt = arithmeticEvaluator(alt.slice(1, alt.length - 1))
  console.log('isConseq', isalt)
  return [isalt, '']
}
function simpleExpression (inputArray) {
  console.log('simple expression', inputArray)
  let openBracePos = []
  let openBraceCount = 0
  let j = 0
  let closeBracePos = []
  let k = 0
  let key
  for (let i = 0; i < inputArray.length; i++) {
    if (inputArray[i] === '(') {
      openBracePos[j++] = i
      console.log('openBracePos, j', openBracePos, j)
      openBraceCount++
      if (openBraceCount > 1) return 'not simple'
      key = inputArray[i + 1]
      console.log('key in cond', key)
    }
    if (inputArray[i] === ')') {
      closeBracePos[k++] = i
      console.log('closeBracePos, k', closeBracePos, k)
      if (closeBracePos[k - 1] - openBracePos[j - 1] === 4) {
        console.log('diff is 4')
        return inputArray.slice(openBracePos[j - 1], closeBracePos[k - 1] + 1)
      }
    }
  }
  return null
}
function nestedExpression (inputArray) {
  let openBracePos = []
  let j = 0
  let closeBracePos = []
  let k = 0
  let key
  for (let i = 1; i < inputArray.length; i++) {
    if (inputArray[i] === '(') {
      openBracePos[j++] = i
      key = inputArray[i + 1]
      console.log('key in cond', key)
    }
    console.log('openBracePos, j-1', openBracePos, j - 1)
    if (inputArray[i] === ')') {
      closeBracePos[k++] = i
      console.log('closeBracePos, k', closeBracePos, k)
      if (closeBracePos[k - 1] - openBracePos[j - 1] === 4) {
        console.log('diff is 4')
        openBracePos.splice(--j)
        console.log('spliced openBracePos', openBracePos)
        closeBracePos.splice(--k)
        console.log('spliced closeBracePos', closeBracePos)
      } else {
        console.log('diff is not 4')
        console.log('diff is ' + (closeBracePos[k - 1] - openBracePos[j - 1]))
        console.log('cond', inputArray.slice(openBracePos[j - 1], closeBracePos[k - 1] + 1))
        return inputArray.slice(openBracePos[j - 1], closeBracePos[k - 1] + 1)
      }
    }
  }
}

function getConseq (inputArray) {
  console.log('conseqInput', inputArray)

  return ['wait', '']
}

let definitionInterpreter = (inputArray) => {
  console.log('defineInput', inputArray)
  // if (inputArray[0] !== 'define') return null
  let value = inputArray.splice(2)
  console.log('value', value)
  let finalResult = expressionParser(value.join())
  if (finalResult === null) return null
  env[`${inputArray[1]}`] = finalResult[0]
  console.log('env', env)
  return ['Global Object successfully updated', '']
}

let arithmeticEvaluator = (input) => {
  console.log('aeval', input)
  let inputArray = input.slice(0)
  let endIndex
  let slicedArray
  let key
  let result = []
  let k = 0
  let finalResult = []
  if (inputArray[0] === '(' || inputArray[inputArray.length - 1] === ')') {
    for (let i = inputArray.length - 1; i >= 0; i--) {
      if (inputArray[i] === ')') endIndex = i
      console.log('endIndex', endIndex)
      if (inputArray[i] === '(') {
        key = inputArray[i + 1]
        console.log('key', key)
        slicedArray = inputArray.slice(i + 2, endIndex)
        console.log('slicedArray', slicedArray)
        if (slicedArray.length !== 2) return null
        result[k++] = env[key](slicedArray)
        console.log('envResult', result)
      }
    }
  } else {
    // (< 3 4)
    slicedArray = inputArray.slice(1, endIndex)
    console.log('slicedArray2', slicedArray)
    if (slicedArray.length === 2) {
      finalResult = env[inputArray[0]](slicedArray)
      console.log('finalResult2', finalResult)
      return [finalResult, '']
    } else {
      let openBracePos
      let closeBracePos
      let res = []
      let j = 0
      for (let i = 0; i <= inputArray.length; i++) {
        // < (+ 3 6) 4
        if (inputArray[i] === '(') {
          openBracePos = i
          console.log('openBrace', openBracePos)
        }
        if (inputArray[i] === ')') {
          closeBracePos = i
          console.log('closeBrace', closeBracePos)
          slicedArray = inputArray.slice(openBracePos + 2, closeBracePos)
          console.log('sliced Array3', slicedArray)
          let key1 = inputArray[openBracePos + 1]
          console.log('key1', key1)
          res[j++] = env[key1](slicedArray)
          console.log('res', res)
        // return [finalResult, '']
        }
      }
      res[j++] = inputArray[inputArray.length - 1] * 1
      console.log('finalres', res)
      finalResult = env[inputArray[0]](res)
      console.log('finalResult0', finalResult)
      return [finalResult, '']
    }
  }

  if (inputArray[0] !== '(') {
    if (isNaN(inputArray[1]) * 1) {
      key = inputArray[0]
      console.log('key1', key)
      result.reverse()
      console.log('reversed result1', result)
      finalResult = env[inputArray[0]](result)
      console.log('finalResult1', finalResult)
      return [finalResult, '']
    } else result[k++] = inputArray[1] * 1
  }
  result.reverse()
  console.log('reversed result', result)
  finalResult = env[inputArray[0]](result)
  console.log('finalResult', finalResult)

  return [finalResult, '']
}

let sExpressionParser = (input) => {
  input = input.trim()
  console.log('sExpinp', input)
  console.log('props', props)
  if (!input.startsWith('(')) return null
  input = input.substr(1).slice(0, -1)
  input = input.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ')
  console.log('removed braces', input)
  let inputArray = input.split(' ')
  console.log('inputArray', inputArray)
  inputArray = inputArray.filter((ele) => { return /\S/.test(ele) })
  console.log('inputArray without spaces', inputArray)
  let result = identifierParser(inputArray)
  if (result === null) return null
  return [result[0], '']
}

let spaceParser = input => input.match(/^[\n*\s\n*]/) ? [null, input.slice(input.match(/\S/).index)] : null
let commaParser = input => input.startsWith(',') ? [null, input.slice(1)] : null

let expressionParser = factoryParser(numberParser, symbolParser, sExpressionParser)

let evaluator = (input) => {
  console.log('inp', input)
  // can be replaced by trim???
  let spaceCheck
  input = (spaceCheck = spaceParser(input)) ? spaceCheck[1] : input
  console.log('new input', input)
  let id = []
  let parsePass

  parsePass = expressionParser(input)
  if (parsePass === null) return null
  if (parsePass !== null) {
    id = parsePass[0]
    console.log('return id', id)
    return id
  }
}
