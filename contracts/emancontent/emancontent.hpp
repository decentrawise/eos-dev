#pragma once
#include <eosiolib/eosio.hpp>


namespace emanate
{

struct soundasset
{
    uint64_t id;                //  The id of this asset
    std::string metadata;       //  Metadata for this asset...this is a JSON string containing all the metadata
    uint64_t totalSecondsPlayed;
    uint64_t totalTimesPlayed;


    uint64_t primary_key() const { return id; }
};

class content : public eosio::contract 
{
    typedef eosio::multi_index<N(soundasset), soundasset> assetTable;

    template<typename callback> void updateStats(account_name owner, uint64_t id, callback &&l);

public:
    
    content( account_name self ):contract(self){}
    
    void addtrack(account_name owner, uint64_t id, const std::string &metadata);
    void removetrack(account_name owner, uint64_t id);
    void startplaying(account_name owner, uint64_t id);
    void play(account_name owner, uint64_t id, uint64_t seconds);
};
    
}   // namespace emanate
