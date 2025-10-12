export const flowbiteTheme: any = {
  button: {
    base: 'group inline-flex items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-wangfeng-purple/30 disabled:pointer-events-none disabled:opacity-60',
    color: {
      primary:
        'bg-wangfeng-purple text-white hover:bg-wangfeng-dark focus:ring-wangfeng-purple/40 dark:bg-wangfeng-purple dark:hover:bg-wangfeng-light',
      secondary:
        'bg-white text-wangfeng-purple border border-wangfeng-purple hover:bg-wangfeng-purple hover:text-white focus:ring-wangfeng-purple/30 dark:bg-transparent dark:text-white dark:hover:bg-wangfeng-purple/10',
      light:
        'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 focus:ring-wangfeng-purple/20 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
      failure:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-900',
    },
    size: {
      xs: 'px-3 py-1 text-xs',
      sm: 'px-4 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-7 py-3.5 text-base',
    },
  },
  card: {
    root: {
      base: 'rounded-2xl border border-wangfeng-purple/20 bg-white/95 shadow-xl shadow-wangfeng-purple/10 backdrop-blur-sm transition-colors dark:border-wangfeng-purple/40 dark:bg-black/80',
      children: 'flex h-full flex-col justify-start gap-4 p-6',
    },
  },
  textInput: {
    field: {
      base: 'relative flex',
      input: {
        base: 'block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-wangfeng-purple focus:ring-wangfeng-purple/40 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-wangfeng-purple/80 dark:focus:ring-wangfeng-purple/40',
        withIcon: {
          on: 'pl-10',
          off: '',
        },
      },
    },
  },
};
