export const getCurrentDate = (): string => 
     new Date().toISOString().split('T')[0]!
