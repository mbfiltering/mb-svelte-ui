/**
 * Sign-in / sign-out vocabulary
 *
 * The four MB Smart portals each own their auth screens, and each used to spell
 * the same six actions its own way — "Login", "Log In", "Sign In", "Sign in",
 * "Logout", "Log out", "Sign out" all shipped at once, and the translations
 * inherited the drift on top of their own ("Iniciar sesión" / "Iniciar Sesión" /
 * "Ingresar"). These are the strings that were the same string all along, so
 * they are authored here once rather than six times per app.
 *
 * The house rules they encode — see `mb-specs/resources/STYLE-GUIDE.md`:
 *   - "Sign in" / "Sign out", never "log in" or "login"
 *   - two words for the verb, hyphenated before a noun ("sign-in code")
 *   - sentence case, so a button reads "Sign in" and not "Sign In"
 *
 * Key-first data, i.e. all six languages at once — it is a dozen strings, and an
 * app must not have to wait for a locale chunk to label its own sign-out button.
 * Registered by each app's i18n module alongside `safetyTranslations`; a
 * consumer that genuinely needs different wording can still override a key from
 * its own locale file, which wins via `registerLocaleLoaders`.
 *
 * @type {Record<string, Record<string, Record<string, string>>>}
 */
export const authTranslations = {
	auth: {
		sign_in: {
			en: 'Sign in',
			es: 'Iniciar sesión',
			fr: 'Se connecter',
			he: 'התחברות',
			ru: 'Войти',
			yi: 'אַרײַנלאָגן'
		},
		// The tab title and page heading are a noun, not the button's verb: French
		// and Russian name the screen ("Connexion", "Вход") where the button says
		// "Se connecter" / "Войти". English spells them the same, which is how the
		// two used to end up as one key per app and drift apart in the locales that
		// distinguish them.
		sign_in_title: {
			en: 'Sign in',
			es: 'Iniciar sesión',
			fr: 'Connexion',
			he: 'התחברות',
			ru: 'Вход',
			yi: 'אַרײַנגאַנג'
		},
		sign_out: {
			en: 'Sign out',
			es: 'Cerrar sesión',
			fr: 'Se déconnecter',
			he: 'התנתקות',
			ru: 'Выйти',
			yi: 'אַרויסלאָגן'
		},
		switch_account: {
			en: 'Switch account',
			es: 'Cambiar de cuenta',
			fr: 'Changer de compte',
			he: 'החלפת חשבון',
			ru: 'Сменить аккаунт',
			yi: 'בײַטן קאָנטע'
		},
		signing_in: {
			en: 'Signing in…',
			es: 'Iniciando sesión…',
			fr: 'Connexion en cours…',
			he: 'מתחבר…',
			ru: 'Выполняется вход…',
			yi: 'לאָגט זיך אַרײַן…'
		},
		sign_in_code: {
			en: 'Sign-in code',
			es: 'Código de acceso',
			fr: 'Code de connexion',
			he: 'קוד התחברות',
			ru: 'Код для входа',
			yi: 'אַרײַנלאָג־קאָד'
		},
		sign_in_link: {
			en: 'Sign-in link',
			es: 'Enlace de acceso',
			fr: 'Lien de connexion',
			he: 'קישור התחברות',
			ru: 'Ссылка для входа',
			yi: 'אַרײַנלאָג־לינק'
		},
		back_to_sign_in: {
			en: 'Back to sign in',
			es: 'Volver a iniciar sesión',
			fr: 'Retour à la connexion',
			he: 'חזרה להתחברות',
			ru: 'Назад ко входу',
			yi: 'צוריק צום אַרײַנלאָגן'
		},
		sign_out_confirm: {
			en: 'Sign out?',
			es: '¿Cerrar sesión?',
			fr: 'Se déconnecter ?',
			he: 'להתנתק?',
			ru: 'Выйти?',
			yi: 'אַרויסלאָגן?'
		},
		sign_in_failed: {
			en: 'Sign-in failed',
			es: 'No se pudo iniciar sesión',
			fr: 'Échec de la connexion',
			he: 'ההתחברות נכשלה',
			ru: 'Не удалось войти',
			yi: 'דער אַרײַנלאָג איז דורכגעפֿאַלן'
		},
		sign_in_slow: {
			en: 'This is taking longer than it should.',
			es: 'Esto está tardando más de lo normal.',
			fr: 'Cela prend plus de temps que prévu.',
			he: 'זה לוקח יותר זמן מהרגיל.',
			ru: 'Это занимает больше времени, чем обычно.',
			yi: 'דאָס נעמט לענגער װי געװײנטלעך.'
		},
		sign_in_slow_hint: {
			en: 'Check your internet connection, then try again.',
			es: 'Comprueba tu conexión a internet y vuelve a intentarlo.',
			fr: 'Vérifiez votre connexion internet, puis réessayez.',
			he: 'בדקו את החיבור לאינטרנט ונסו שוב.',
			ru: 'Проверьте подключение к интернету и попробуйте снова.',
			yi: 'קוקט איבער די אינטערנעט־פֿאַרבינדונג און פּרוּווט נאָך אַ מאָל.'
		},
		try_again: {
			en: 'Try again',
			es: 'Intentar de nuevo',
			fr: 'Réessayer',
			he: 'נסו שוב',
			ru: 'Попробовать снова',
			yi: 'פּרוּווט נאָך אַ מאָל'
		},
		session_expired: {
			en: 'Session expired. Please sign in again.',
			es: 'La sesión expiró. Vuelve a iniciar sesión.',
			fr: 'Session expirée. Veuillez vous reconnecter.',
			he: 'פג תוקף ההתחברות. יש להתחבר מחדש.',
			ru: 'Сессия истекла. Войдите снова.',
			yi: 'די סעסיע איז אויסגעגאַנגען. לאָגט זיך װידער אַרײַן.'
		}
	}
};
