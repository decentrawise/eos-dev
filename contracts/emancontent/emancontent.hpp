#pragma once
#include <eosiolib/eosio.hpp>


namespace emanate
{

struct trackMetadata
{
    std::string trackName;
    std::string artistName;
    
    EOSLIB_SERIALIZE( trackMetadata, (trackName)(artistName) )
};

struct track
{
    uint64_t id;                //  The id of this track
    std::string title;
    trackMetadata metadata;
    
    auto primary_key() const { return id; }
};


class content : public eosio::contract 
{
    typedef eosio::multi_index<N(track), track> trackTable;
    
public:
    
    content( account_name self ):contract(self){}
    
    void addtrack(account_name owner, const trackMetadata &metadata);
};
    
}   // namespace emanate
