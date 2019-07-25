# dialogflow-intent-parser

## Limitations

- Depending on intent, the json template in the script may need adjusted.
- Requires setting values at the top of the script to prepare it for execution.
- If parameter strings/synonyms contain multiple words such as `token 1`, they must be listed in the hyphenated form. ‘token 1’ would be ‘token-1’ resulting in a parameter array like [‘token-1’, ‘token-2’]
- The logic will always force the strings to be hyphenated while processing to guarantee they are processed as a single token. It will then remove the hyphens at the end but the values in the params array have to be hyphenated prior to running it.
- Any words which are duplicated in the phrase will be ignored in there subsequent instances.

### Note: If you are unsure what the id values should be for the intent and parameter entities, leaving them empty will allow dialogflow to generate new ones for you. You can also export the intent from dialog flow initially and copy them from the resulting json.
