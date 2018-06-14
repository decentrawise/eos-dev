#pragma once
#include <eosiolib/eosio.hpp>


namespace emanate
{

struct track
{
    uint64_t id;                //  The id of this track
    uint64_t checksum;          //  Checksum for the title
    std::string title;          //  Title of the track
    std::string metadata;       //  Metadata for this track...this is a JSON string containing all the metadata
    
    static const uint64_t secondaryName = N(bychecksum);
    
    uint64_t primary_key() const { return id; }
    uint64_t get_secondary() const { return checksum; }

    typedef eosio::indexed_by<track::secondaryName, eosio::const_mem_fun<track, uint64_t, &track::get_secondary>> SecondaryIndex;
};

struct stat {
    uint64_t id;                    //  The track title checking will serve as an id
    uint64_t totalSecondsPlayed;
    uint64_t totalTimesPlayed;

    uint64_t primary_key() const { return id; }
};

class content : public eosio::contract 
{
    typedef eosio::multi_index<N(track), track, track::SecondaryIndex> trackTable;
    typedef eosio::multi_index<N(stat), stat> statTable;

    uint64_t calculateChecksum(const std::string &str);
    template<typename callback> void updateStats(account_name owner, const std::string &title, callback &&l);

public:
    
    content( account_name self ):contract(self){}
    
    void addtrack(account_name owner, const std::string &title, const std::string &metadata);
    void removetrack(account_name owner, const std::string &title);
    void startplaying(account_name owner, const std::string &title);
    void play(account_name owner, const std::string &title, uint64_t seconds);
};
    
}   // namespace emanate
