const readline = require('readline')
const fs = require('fs')

/**
 * Enable to automatically remove quotes and/or commas
 * from the input phrases.
 */
const includesQuotesOrCommas = false

/* 
  Be sure to replace the word sample with the name of the
  intent you are parsing.
*/

const inputFile = 'example_phrases.txt'
const outputFile = 'example-intent.json'

const intentName = 'Example'

// optional
const intentId = '8b780063-bf10-49e8-a97d-ed87bffb606d'

const ignoredInvocationString = 'example'

/* Should match all possible slots in dialogflow for the
 * params which need to be matched to entities. The order of
 * the strings must be the same as it is in the array of params and types below.
 */
const paramStrings = [['slot', 'slots'], ['token-1', 'token-2']]

const params = [
  {
    text: '',
    alias: 'slotType',
    meta: '@slotType',
    userDefined: false
  },
  {
    text: '',
    alias: 'token',
    meta: '@token',
    userDefined: false
  }
]

const parameterTypes = [
  {
    id: '4f43a755-2485-4dd6-a2bd-2e0c2a5ec7cb',
    required: false,
    dataType: '@token',
    name: 'token',
    value: '$token',
    isList: false
  },
  {
    id: '177a512b-62fe-42bc-9492-4fcc1cf5dbd1',
    required: false,
    dataType: '@slotType',
    name: 'slotType',
    value: '$slotType',
    isList: false
  }
]

const affectedContext = [
  {
    name: 'Example-followup',
    parameters: {},
    lifespan: 2
  }
]

const responseMessages = [
  {
    type: 0,
    speech:
      'It sounds like you would like to know your example, is that correct?'
  }
]

const eventList = [
  {
    name: 'actions_intent_CONFIRMATION'
  }
]

const templateJson = {
  id: intentId,
  name: intentName,
  auto: true,
  contexts: [],
  responses: [
    {
      resetContexts: false,
      affectedContexts: affectedContext,
      parameters: parameterTypes,
      messages: responseMessages,
      defaultResponsePlatforms: {},
      speech: []
    }
  ],
  priority: 500000,
  webhookUsed: false,
  webhookForSlotFilling: false,
  fallbackIntent: false,
  events: eventList,
  userSays: [],
  followUpIntents: [],
  liveAgentHandoff: false,
  endInteraction: false,
  templates: []
}

const ignoredInvocationObject = {
  text: ignoredInvocationString,
  meta: '@sys.ignore',
  userDefined: false
}
const plainPhrase = {
  text: '',
  userDefined: false
}
const spacerObject = {
  text: ' ',
  userDefined: false
}

const logger = val => console.log(`DEBUG - ${val}`)

const readInterface = readline.createInterface({
  input: fs.createReadStream(inputFile),
  output: process.stdout,
  console: false
})

const removeQuotesAndCommas = line => line.replace(/['",]+/g, '')

function flatten(a) {
  return Array.isArray(a) ? [].concat(...a.map(flatten)) : a
}

const hyphenateAllParams = phrase => {
  let newPhrase = phrase
  const combinedParams = flatten(paramStrings)
  combinedParams.forEach(s => {
    newPhrase = newPhrase.replace(dehyphenate(s), s)
  })
  return newPhrase
}
const hyphenate = phrase => phrase.replace(/ /g, '-')
const dehyphenate = phrase => phrase.replace(/-/g, ' ')

const isPlainItem = item =>
  !(item === ignoredInvocationString || flatten(paramStrings).includes(item))

const checkListSubStrings = (list, item) => list.map(x => x.includes(item))

const checkAnyMatch = (list, item) =>
  checkListSubStrings(list, item).some(x => x === true)

const mergePlainPhrases = phraseList =>
  phraseList.reduce((acc, item, index, array) => {
    if (checkAnyMatch(acc, item)) {
      return acc
    }
    if (isPlainItem(item)) {
      const next = array[index + 1]

      if (next && isPlainItem(next)) {
        let combinedPlainWords = item
        let i = 1
        do {
          combinedPlainWords += ' ' + array[index + i]
          i++
        } while (array[index + i] && isPlainItem(array[index + i]))
        acc.push(combinedPlainWords)
        return acc
      }
      acc.push(item)
      return acc
    }
    acc.push(item)
    return acc
  }, [])

const speechList = phrase => mergePlainPhrases(phrase.split(' '))

const phraseSpacer = (index, word, arr) =>
  index === 0 ? `${word} ` : arr[index + 1] ? ` ${word} ` : ` ${word}`

const findMatchingIndex = (item, array) => array.findIndex(x => x === item)

const getNestedListIndexes = (item, array) =>
  array.reduce((acc, data, index) => {
    const i = findMatchingIndex(item, data)
    if (i !== -1) {
      acc.push({ paramIndex: index, matchedStringIndex: i })
    }
    return acc
  }, [])

const buildPhraseFragments = phrase =>
  speechList(hyphenateAllParams(phrase)).reduce((acc, p, i, arr) => {
    //logger(p)
    const lastItem = [...acc].pop()
    const followsSpacer = lastItem === spacerObject
    const followsPlain = lastItem ? !lastItem.meta : false
    const phraseFragment = dehyphenate(p)
    const paramIndexList = getNestedListIndexes(p, paramStrings)
    //logger(paramIndexList[1].matchedStringIndex)
    if (i === 0) {
      if (p === ignoredInvocationString) {
        acc.push(ignoredInvocationObject)
        acc.push(spacerObject)
        return acc
      } else if (paramIndexList[0]) {
        acc.push({
          ...params[paramIndexList[0].paramIndex],
          text: phraseFragment
        })
        acc.push(spacerObject)
        return acc
      } else {
        acc.push({
          ...plainPhrase,
          text: phraseSpacer(i, phraseFragment, arr)
        })
        return acc
      }
    } else if (!arr[i + 1]) {
      if (p === ignoredInvocationString) {
        acc.push(ignoredInvocationObject)
        return acc
      } else if (paramIndexList[0]) {
        acc.push({
          ...params[paramIndexList[0].paramIndex],
          text: phraseFragment
        })
        return acc
      } else {
        acc.push({
          ...plainPhrase,
          text:
            followsSpacer || followsPlain
              ? phraseFragment
              : phraseSpacer(i, phraseFragment, arr)
        })
        return acc
      }
    } else {
      if (p === ignoredInvocationString) {
        acc.push(ignoredInvocationObject)
        acc.push(spacerObject)
        return acc
      } else if (paramIndexList[0]) {
        acc.push({
          ...params[paramIndexList[0].paramIndex],
          text: phraseFragment
        })
        acc.push(spacerObject)
        return acc
      } else {
        acc.push({
          ...plainPhrase,
          text:
            followsSpacer || followsPlain
              ? phraseSpacer(0, phraseFragment, arr)
              : phraseSpacer(i, phraseFragment, arr)
        })
        return acc
      }
    }
  }, [])

readInterface.on('line', line => {
  const parsedPhraseFragment = buildPhraseFragments(
    includesQuotesOrCommas ? removeQuotesAndCommas(line) : line
  )
  const newPrase = {
    data: parsedPhraseFragment,
    isTemplate: false,
    count: 0,
    updated: 0,
    isAuto: false
  }

  templateJson.userSays.push(newPrase)
})
readInterface.on('close', () => {
  let data = JSON.stringify(templateJson)
  fs.writeFileSync(outputFile, data)
})
