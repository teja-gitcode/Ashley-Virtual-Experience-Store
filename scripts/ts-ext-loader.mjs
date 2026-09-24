/** Lets node tests import extensionless TypeScript files such as catalog.ts. */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(m|c)?[jt]s$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      return nextResolve(specifier, context);
    }
  }
  return nextResolve(specifier, context);
}
