export type Language = 'tr' | 'en' | 'ru' | 'ka'

export const translations = {
  tr: {
    welcome: 'Hoş Geldiniz',
    enterName: 'Lütfen Adınızı Girin',
    namePlaceholder: 'Örn. Ahmet, Burcu',
    startSession: 'Menüyü İncele & Sipariş Ver',
    languageSelect: 'Dil Seçin',
    table: 'Masa',
    branch: 'Şube',
    requiredField: 'Bu alan gereklidir',
    invalidTable: 'Geçersiz QR Kod',
    invalidTableDesc: 'Okuttuğunuz QR kod sistemimizde kayıtlı bir masaya ait değil. Lütfen garsona danışın veya tekrar deneyin.',
    loading: 'Yükleniyor...',
    welcomeMessage: 'Siparişlerinizin mutfağa iletilebilmesi ve garsonların size isminizle hitap edebilmesi için adınızı giriniz.'
  },
  en: {
    welcome: 'Welcome',
    enterName: 'Please Enter Your Name',
    namePlaceholder: 'e.g. John, Sarah',
    startSession: 'View Menu & Order',
    languageSelect: 'Select Language',
    table: 'Table',
    branch: 'Branch',
    requiredField: 'This field is required',
    invalidTable: 'Invalid QR Code',
    invalidTableDesc: 'The QR code you scanned does not belong to a registered table. Please ask a waiter or try again.',
    loading: 'Loading...',
    welcomeMessage: 'Please enter your name so that your orders can be sent to the kitchen and the staff can serve you by name.'
  },
  ru: {
    welcome: 'Добро пожаловать',
    enterName: 'Пожалуйста, введите ваше имя',
    namePlaceholder: 'Напр. Иван, Анна',
    startSession: 'Посмотреть меню и заказать',
    languageSelect: 'Выберите язык',
    table: 'Стол',
    branch: 'Филиал',
    requiredField: 'Это поле обязательно',
    invalidTable: 'Неверный QR-код',
    invalidTableDesc: 'QR-код, который вы отсканировали, не принадлежит зарегистрированному столу. Пожалуйста, обратитесь к официанту.',
    loading: 'Загрузка...',
    welcomeMessage: 'Пожалуйста, введите свое имя, чтобы ваши заказы могли быть отправлены на кухню и персонал мог обращаться к вам по имени.'
  },
  ka: {
    welcome: 'კეთილი იყოს თქვენი მობრძანება',
    enterName: 'გთხოვთ შეიყვანოთ თქვენი სახელი',
    namePlaceholder: 'მაგ. გიორგი, ნინო',
    startSession: 'მენიუს ნახვა და შეკვეთა',
    languageSelect: 'აირჩიეთ ენა',
    table: 'მაგიდა',
    branch: 'ფილიალი',
    requiredField: 'ეს ველი სავალდებულოა',
    invalidTable: 'არასწორი QR კოდი',
    invalidTableDesc: 'თქვენ მიერ სკანირებული QR კოდი არ ეკუთვნის დარეგისტრირებულ მაგიდას. გთხოვთ მიმართოთ ოფიციანტს.',
    loading: 'იტვირთება...',
    welcomeMessage: 'გთხოვთ შეიყვანოთ თქვენი სახელი, რათა თქვენი შეკვეთები გაიგზავნოს სამზარეულოში და პერსონალმა სახელით მოგმართოთ.'
  }
}
