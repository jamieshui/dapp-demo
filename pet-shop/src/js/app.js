App = { // nodejs
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets. 如果会VUE童鞋可以尝试采用VUE进行重构
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    /*
     * Replace me...
     */
    // 新DPP浏览器,(自带钱包),或者最新版metamask, 有一个ehternum 对象,此对象默认会注入到window中
    // 应该优先使用ethernum来构建web3对象
    if (window.ethereum){
        // 新版本才有此功能
        console.log('if......');
        App.web3Provider = window.ethereum
        try{
            // 请求应用程序与账户进行关联
            await window.ethereum.enable();
        }catch(error){
             console.error('程序与账户未关联....');
        }
    }
    else if(typeof web3 !== 'undefined'){
       console.log('else if......');
       App.web3Provider = web3.currentProvider;
    }else{
      console.log('else......');
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545')
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function() {
    // jquery $.getJSON用来获取json格式的文件
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var AdoptionArtifact = data;
      // 获取json文件中的合约名词
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      // 配置合约关联的私有链
      App.contracts.Adoption.setProvider(App.web3Provider);
      // Use our contract to retieve and mark the adopted pets.
      return App.markAdopted();
    });
    console.info('initContract......');
    return App.bindEvents();
  },
  // 实现了给页面领养按钮的事件绑定
  bindEvents: function() {
    // 给页面所有的领养按钮注册了click事件
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },
  // 标记宠物的领养状态
  markAdopted: function(adopters, account) {
     console.info('markAdopted......');
     var adoptionInstance;
     // 1: 根据宠物的状态来修改按钮
     App.contracts.Adoption.deployed().then(function(instance) {
       // 获取已经实例化的智能合约对象
       adoptionInstance = instance;
       // 返回 address[16] public adopters;
       return adoptionInstance.getAdopters();
     }).then(function(adopters) {
         console.log(adopters.length);
         for(i=0;i<adopters.length;i++){
            // 如果当前宠物被领养则地址不为 address(0x0)
            if(adopters[i]!='0x0000000000000000000000000000000000000000'){
                // 当前宠物已经被领养,通过jquery设置按钮状态为不可见
                console.log(adopters[i]);
                $('.panel-pet').eq(i).find('button').text('success').attr('disabled',true);
            }
         }
     }).catch(function(err) {
       console.log(err.message);
     });
  },

  handleAdopt: function(event) {
    // 获取当前单击按钮对应宠物的id
    var petId = parseInt($(event.target).data('id'));
    console.info('宠物的ID为:' + petId);
    // 此变量用来存储实例化的合约
    var adoptionInstance;
    // 由于当前采用的是truffle 4.x + web3 0.x的版本,因此选择合适API查看
    App.contracts.Adoption.deployed().then(function(instance) {
      // 获取已经实例化的智能合约对象
      adoptionInstance = instance;
      return adoptionInstance.adopt(petId);
    }).then(function(result) {
      console.info('result %o', result);
      // 调用标记宠物状态函数
      return App.markAdopted();
    }).catch(function(err) {
      console.log(err.message);
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
