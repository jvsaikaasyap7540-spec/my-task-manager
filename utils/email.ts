const localPartPattern = /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;
const domainLabelPattern = /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;
const topLevelDomainPattern = /^(?:[A-Z]{2,63}|XN--[A-Z0-9-]{2,59})$/i;

export function isValidEmail(email: string): boolean {
  if (email.length > 254 || email !== email.trim()) {
    return false;
  }

  const separatorIndex = email.lastIndexOf('@');
  if (separatorIndex < 1) {
    return false;
  }

  const localPart = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);
  if (localPart.length > 64 || !localPartPattern.test(localPart) || domain.length > 253) {
    return false;
  }

  const labels = domain.split('.');
  return labels.length >= 2
    && labels.every((label) => label.length <= 63 && domainLabelPattern.test(label))
    && topLevelDomainPattern.test(labels[labels.length - 1]);
}
