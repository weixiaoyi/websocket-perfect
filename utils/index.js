import _ from 'lodash'

export const formatJson = (string) => {
  if (_.isObjectLike(string)) return string
  return JSON.parse(string)
}