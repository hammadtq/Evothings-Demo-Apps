(function () {

    var con = document.getElementById('log');

    var log = function (text) {
    
        var e = document.createElement('span'),
            br = document.createElement('br');

        e.innerHTML = text;

        con.appendChild(e);
        con.appendChild(br);
    
    };

    var client  = new ModbusClient(),
        loop    = new Loop(client),
        wr      = 0;

   
    loop.readInputRegisters(10, 4);
    loop.readInputRegisters(14, 4);
    loop.readInputRegisters(18, 4);
    loop.readInputRegisters(30, 4); 

    loop.on('update', function (data) {
    
        console.log(data);

    });

    var write = function () {
    
        var offset  = parseInt($('#offset').val());

        log('Writing ' + wr + ' to ' + offset);

        client.writeSingleRegister(offset, wr++).then(function () {
        
            log('Writing Register done!');

        }).fail(function () {
        
            log('Writing Register failed.');
        
        });
    
    };

    document.getElementById('write').addEventListener('click', write);

    log('Start connection...');

    $('#console').hide();


    client.on('connected', function () {
    
        log('Connection established.');  

        loop.start();

        $('#connect').hide();
        $('#console').show();
  
    });

    client.on('disconnected', function () {
  
        log('Connection closed.');

        loop.stop();

        $('#connect').show();
        $('#disconnect').hide(); 

    });

    client.on('error', function () {

        log('Connection error.');

        loop.stop();

        setTimeout(function () {
        
            client.reconnect();

        }, 5000);

    });

    $('#connect_button').on('click', function () {

        var host    = $('#host').val(),
            port    = parseInt($('#port').val());

        client.connect(host, port);

    });

})();