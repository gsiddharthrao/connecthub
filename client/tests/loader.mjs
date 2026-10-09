export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context);
  } catch (e) {
    if (!specifier.endsWith('.js') && !specifier.endsWith('.mjs')) {
      try {
        return await defaultResolve(specifier + '.js', context);
      } catch (e2) {
        try {
          return await defaultResolve(specifier + '/index.js', context);
        } catch (e3) {
          throw e;
        }
      }
    }
    throw e;
  }
}
