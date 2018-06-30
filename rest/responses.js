
var Responses = {
    ok: function(data) {
        if( data == null ) {
            data = {};
        }
        return { success: true, data: data };
    },    
    error: function(data) {
        if( data == null ) {
            data = {};
        }
        return { success: false, data: data };
    }
};

module.exports = Responses;
