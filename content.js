class Content{
    constructor(user){
        if(user)this.user = user;
    }

    static get helloMsg() { return  'Приветствуем. Расскажите в каком статусе Вы находитесь:'};
    static get repeatHelloMsg() { return 'В каком статусе Вы находитесь:'};
    static get connectMsg() { return  'Желаете связатся с менеджером?'}; 
    static get waitMsg() { return  'Ожидайте. Первый освободившийся менеджер свяжется с вами'};           
    static get managerNotFoundMsg() { return  'Извините, свободных менеджеров не найдено'};           
    static get orderCreatedMsg() { return  'Ваша заявка принята'};           
    static get userTypes() { return [
        {id: 'plan_setup', name: "Планирую установить ГБО"},
        {id: 'plan_work', name: "Хочу стать партнером"},
        {id: 'alredy_setup', name: "Уже установил ГБО"}
    ]};

    get initialContent(){
        switch(this.user.type){
            case 'plan_setup': {
                return [
                    '3 причины установить ГБО в авторизированных центрах  PRIDEGАS',
                    `Это настоящее ГБО из Италии с комплектующими от одного производителя и европейский уровень обслуживания. Наш принцип - максимум внимания к потребностям каждого клиента и индивидуальный подход к каждой модели автомобиля.Почему именно мы:\n1) опыт установок с 2004-го года, за этот период установлено более 12-ти тыс. комплектов ГБО на разные типы двигателей. Мы работаем на рынке более 10-ти лет и за это время создали себе безупречную репутация - вы не найдете отрицательные отзывы о нашей работе;\n2) мы устанавливаем ГБО на карбюраторными и инжекторными двигателями, с любыми типами ГБО одинаково профессионально;\n3) комплекты ГБО PRIDE by AEB разработаны специально для эксплуатации в украинских условиях и считаются одними из самых безопасных в Европе.`,
                ]
            }
            case 'plan_work': {
                return [
                ]
            }
            case 'alredy_setup': {
                return [
                    `Как правило, при установке качественного сертифицированного газового оборудования на автомобиль, вам не придется сталкиваться с капитальным ремонтом при  соблюдении норм эксплуатации. В данном случае достаточно проведение своевременного текущего технического обслуживания ГБО, т.к. даже оборудование самого высокого качества подвергается влиянию используемого топлива и другим внешним воздействиям эксплуатационного характера.\nТекущее обслуживание ГБО – процедура, которая позволит диагностировать работоспособность системы, выделить на ранней стадии возможные неполадки и заблаговременно их устранить. Имея большой опыт работы с системами ГБО, мы рекомендуем нашим клиентам проводить именно текущее обслуживание ГБО, данный комплекс позволит сэкономить как время на возможный простой автомобиля при поломке, так и деньги на капитальный ремонт.`
                ]
            }
            default:
                return [];
        }
    }

    get actionMsg(){
        switch(this.user.type){
            case 'plan_setup': {
                return 'Записаться'
            }
            case 'plan_work': {
                return 'Подать заявку'
            }
            case 'alredy_setup': {
                return 'Записаться на ТО'
            }
        }
    }

    get orderData(){
        switch(this.user.type){
            case 'alredy_setup':
            case 'plan_setup': {
                return [
                    {id: 'name', title: 'Ваше имя:', next: 'car'},
                    {id: 'car', title: 'Марка и модель автомобиля:', next: 'year'},
                    {id: 'year', title: 'Год выпуска:', next: 'engine'},
                    {id: 'engine', title: 'Объем двигателя:', next: 'phone'},
                    {id: 'phone', title: 'Номер телефона:', next: null},
                ]
            }
            case 'plan_work': {
                return [
                    {id: 'area', title: 'Род деятельности:', next: 'city', kb: [['Руководитель СТО', 'Установщик ГБО', 'Владелец магазина']]},
                    {id: 'city', title: 'В каком городе вы находитесь?', next: 'phone'},
                    {id: 'phone', title: 'Номер телефона:', next: null},
                ]
            }
        }
    }

    
}

module.exports = Content;