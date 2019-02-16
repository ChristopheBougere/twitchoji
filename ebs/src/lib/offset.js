const zlib = require('zlib');

/**
 * encodes lastEvaluatedKey for use in URL
 *
 * @param  {Object} lastEvaluatedKey the last evaluated key given by a query string
 * @return {String}                  the lastEvaluatedKey stringified, encoded, compressed, base64
 */
function encodeOffset(lastEvaluatedKey) {
  try {
    if (lastEvaluatedKey) {
      return Buffer.from(
        zlib.deflateRawSync(
          encodeURIComponent(
            JSON.stringify(lastEvaluatedKey),
          ),
        ),
      ).toString('base64');
    }
  } catch (err) {
    console.error('-- encodeOffset --');
    console.error(err);
  }
  return null;
}

/**
 * decodes an offset in order to retrieve the last evaluated key
 *
 * @param  {String} offset lastEvaluatedKey stringified, encoded, compressed, base64
 * @return {String}        the last evaluated key
 */
function decodeOffset(offset) {
  try {
    if (offset) {
      return JSON.parse(
        decodeURIComponent(
          zlib.inflateRawSync(
            Buffer.from(offset, 'base64'),
          ).toString(),
        ),
      );
    }
  } catch (err) {
    console.error('-- decodeOffset --');
    console.error(err);
  }
  return null;
}

module.exports = {
  encodeOffset,
  decodeOffset,
};
